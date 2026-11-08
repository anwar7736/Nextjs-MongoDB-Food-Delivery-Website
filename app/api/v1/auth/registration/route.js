import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import { mongoDB_connect } from "@/app/helpers/helper";
import { userSchema } from "@/app/models/userModel";
import { deliverySchema } from "@/app/models/deliveryModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { emailVerificationOtpSchema } from "@/app/models/emailVerificationOtpModel";
import { createEmailVerificationCode } from "@/app/lib/emailVerification";
import { sendEmailVerificationCode } from "@/app/lib/email";

const accountModels = {
  user: userSchema,
  delivery: deliverySchema,
  restaurant: restaurantSchema,
};

function response(success, message, status = 200, extra = {}) {
  return NextResponse.json({ success, message, ...extra }, { status });
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const accountType = payload?.accountType;
    const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
    const accountModel = Object.hasOwn(accountModels, accountType) ? accountModels[accountType] : null;

    if (!accountModel || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response(false, "Enter a valid email address.", 400, {
        fieldErrors: { email: "Enter a valid email address." },
      });
    }
    if (payload.action !== "request") {
      return response(false, "Unsupported email verification action.", 400);
    }

    await mongoDB_connect();
    if (await accountModel.exists({ email })) {
      return response(false, "Email address already used.", 409, {
        fieldErrors: { email: "Email address already used." },
      });
    }

    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    let otp;
    try {
      otp = await createEmailVerificationCode(accountType, email, code);
    } catch (error) {
      if (error.code === 11000) {
        return response(false, "Please wait a minute before requesting another code.", 429);
      }
      throw error;
    }

    if (!otp) {
      return response(false, "Please wait a minute before requesting another code.", 429);
    }

    try {
      await sendEmailVerificationCode(email, code);
    } catch (error) {
      await emailVerificationOtpSchema.updateOne({ _id: otp._id }, { $unset: { code_hash: 1 } });
      console.error("Email verification delivery failed:", error.message);
      return response(false, "Unable to send the verification code right now. Please try again later.", 503);
    }

    return response(true, "A verification code has been sent to your email.");
  } catch (error) {
    console.error("Email verification request failed:", error.message);
    return response(false, "Email verification is unavailable right now.", 500);
  }
}
