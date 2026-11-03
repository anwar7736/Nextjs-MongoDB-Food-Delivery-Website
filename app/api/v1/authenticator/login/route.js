import { mongoDB_connect } from "@/app/helpers/helper";
import { userSchema } from "@/app/models/userModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { deliverySchema } from "@/app/models/deliveryModel";
import {
  publicAccount,
  setAuthSessionCookie,
  verifyAuthenticatorCode,
  verifyLoginChallenge,
} from "@/app/lib/authenticator";
import { NextResponse } from "next/server";

const accountModels = {
  user: userSchema,
  restaurant: restaurantSchema,
  delivery: deliverySchema,
};

export async function POST(request) {
  try {
    const { challenge, code } = await request.json();
    const verifiedChallenge = verifyLoginChallenge(challenge);
    if (!verifiedChallenge) {
      return NextResponse.json({ success: false, message: "Login challenge is invalid or expired." }, { status: 401 });
    }

    await mongoDB_connect();
    const accountModel = accountModels[verifiedChallenge.type];
    const account = await accountModel.findById(verifiedChallenge.id).select("+twoFactorSecret");
    if (!account || !account.twoFactorEnabled || !account.twoFactorSecret) {
      return NextResponse.json({ success: false, message: "Authenticator verification is unavailable." }, { status: 401 });
    }

    if (account.twoFactorLockUntil && account.twoFactorLockUntil > new Date()) {
      return NextResponse.json({ success: false, message: "Too many attempts. Try again in a few minutes." }, { status: 429 });
    }

    if (account.twoFactorLockUntil) {
      account.twoFactorFailedAttempts = 0;
      account.twoFactorLockUntil = null;
    }

    const step = verifyAuthenticatorCode(
      account.twoFactorSecret,
      code,
      account.twoFactorLastUsedStep
    );
    if (step === null) {
      const failures = (account.twoFactorFailedAttempts || 0) + 1;
      const update = failures >= 5
        ? { $set: { twoFactorFailedAttempts: 0, twoFactorLockUntil: new Date(Date.now() + 5 * 60 * 1000) } }
        : { $set: { twoFactorFailedAttempts: failures, twoFactorLockUntil: null } };
      await accountModel.updateOne({ _id: account._id }, update);
      return NextResponse.json({ success: false, message: "The authenticator code is invalid or expired." }, { status: 401 });
    }

    const update = await accountModel.updateOne({
      _id: account._id,
      twoFactorEnabled: true,
      $or: [
        { twoFactorLastUsedStep: { $lt: step } },
        { twoFactorLastUsedStep: { $exists: false } },
      ],
    }, { $set: {
      twoFactorLastUsedStep: step,
      twoFactorFailedAttempts: 0,
      twoFactorLockUntil: null,
    } });

    if (update.modifiedCount === 0) {
      return NextResponse.json({ success: false, message: "This authenticator code has already been used." }, { status: 401 });
    }

    const response = NextResponse.json({
      success: true,
      message: "Login successfully.",
      data: publicAccount(account),
    });
    setAuthSessionCookie(response, verifiedChallenge.type, account._id);
    return response;
  } catch (error) {
    console.error("Authenticator login failed:", error.message);
    return NextResponse.json({
      success: false,
      message: "Authenticator service is unavailable. Check the server configuration.",
    }, { status: 500 });
  }
}
