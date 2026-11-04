import { mongoDB_connect } from "@/app/helpers/helper";
import { userSchema } from "@/app/models/userModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { deliverySchema } from "@/app/models/deliveryModel";
import {
  createAuthenticatorSecret,
  createAuthenticatorUri,
  encryptAuthenticatorSecret,
  verifyAuthenticatorCode,
} from "@/app/lib/authenticator";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { verifyAuthSession } from "@/app/lib/session";

const accountModels = {
  user: userSchema,
  restaurant: restaurantSchema,
  delivery: deliverySchema,
};

function response(success, message, status = 200, extra = {}) {
  return NextResponse.json({ success, message, ...extra }, { status });
}

export async function POST(request) {
  try {
    const { action, accountType, accountId, password, code } = await request.json();
    const accountModel = accountModels[accountType];
    if (!accountModel || typeof accountId !== "string" || typeof password !== "string") {
      return response(false, "Invalid authenticator request.", 400);
    }
    if (!["setup", "confirm", "disable"].includes(action)) {
      return response(false, "Unsupported authenticator action.", 400);
    }

    const session = await verifyAuthSession(request.cookies.get("auth_session")?.value || "");
    if (session?.type !== accountType || session.id !== accountId) {
      return response(false, "Sign in again before changing authenticator settings.", 401);
    }

    await mongoDB_connect();
    const account = await accountModel.findById(accountId).select(
      "+twoFactorSecret +twoFactorPendingSecret"
    );
    if (!account || !(await bcrypt.compare(password, account.password))) {
      return response(false, "The password is incorrect.", 401);
    }

    if (action === "setup") {
      if (account.twoFactorEnabled) {
        return response(false, "Authenticator two-factor authentication is already enabled.", 409);
      }

      const secret = createAuthenticatorSecret();
      account.twoFactorPendingSecret = encryptAuthenticatorSecret(secret);
      await account.save();
      const accountLabel = account.email || account.phone || account.name || accountId;
      const qrCode = await QRCode.toDataURL(createAuthenticatorUri(secret, accountLabel), {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 240,
      });
      return response(true, "Scan the QR code or enter the setup key, then verify the six-digit code.", 200, {
        qrCode,
        secret,
      });
    }

    if (action === "confirm") {
      if (account.twoFactorEnabled || !account.twoFactorPendingSecret) {
        return response(false, "Start authenticator setup before confirming a code.", 409);
      }
      const step = verifyAuthenticatorCode(account.twoFactorPendingSecret, code);
      if (step === null) return response(false, "The authenticator code is invalid or expired.", 400);

      account.twoFactorSecret = account.twoFactorPendingSecret;
      account.twoFactorPendingSecret = undefined;
      account.twoFactorEnabled = true;
      account.twoFactorLastUsedStep = step;
      account.twoFactorFailedAttempts = 0;
      account.twoFactorLockUntil = null;
      await account.save();
      return response(true, "Authenticator two-factor authentication is enabled.");
    }

    if (!account.twoFactorEnabled || !account.twoFactorSecret) {
      return response(false, "Authenticator two-factor authentication is not enabled.", 409);
    }
    const step = verifyAuthenticatorCode(
      account.twoFactorSecret,
      code,
      account.twoFactorLastUsedStep
    );
    if (step === null) return response(false, "The authenticator code is invalid or expired.", 400);

    account.twoFactorEnabled = false;
    account.twoFactorSecret = undefined;
    account.twoFactorPendingSecret = undefined;
    account.twoFactorLastUsedStep = -1;
    account.twoFactorFailedAttempts = 0;
    account.twoFactorLockUntil = null;
    await account.save();
    return response(true, "Authenticator two-factor authentication is disabled.");
  } catch (error) {
    console.error("Authenticator request failed:", error.message);
    return response(false, "Authenticator service is unavailable. Check the server configuration.", 500);
  }
}
