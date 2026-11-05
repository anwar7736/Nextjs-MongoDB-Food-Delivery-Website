import { randomInt } from "node:crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { mongoDB_connect } from "@/app/helpers/helper";
import { userSchema } from "@/app/models/userModel";
import { deliverySchema } from "@/app/models/deliveryModel";
import { restaurantSchema } from "@/app/models/restaurantModel";
import { passwordResetOtpSchema } from "@/app/models/passwordResetOtpModel";
import { sendPasswordResetCode } from "@/app/lib/email";

const accountModels = {
  user: userSchema,
  delivery: deliverySchema,
  restaurant: restaurantSchema,
};
const RESEND_COOLDOWN_MS = 60 * 1000;
const OTP_LIFETIME_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

function response(success, message, status = 200, extra = {}) {
  return NextResponse.json({ success, message, ...extra }, { status });
}

function validEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request) {
  try {
    const payload = await request.json();
    const { action, accountType } = payload || {};
    const email = typeof payload?.email === "string" ? payload.email.trim().toLowerCase() : "";
    const accountModel = Object.hasOwn(accountModels, accountType)
      ? accountModels[accountType]
      : null;
    if (!accountModel || !validEmail(email)) {
      return response(false, "Enter a valid email address.", 400, {
        fieldErrors: { email: "Enter a valid email address." },
      });
    }

    await mongoDB_connect();

    if (action === "request") {
      const now = new Date();
      const account = await accountModel.findOne({ email });
      const code = account ? String(randomInt(0, 1_000_000)).padStart(6, "0") : null;
      const update = {
        $set: {
          account_type: accountType,
          email,
          last_sent_at: now,
          expires_at: new Date(now.getTime() + OTP_LIFETIME_MS),
          attempts: 0,
        },
        $unset: { code_hash: 1, consumed_at: 1 },
      };

      let otp;
      try {
        otp = await passwordResetOtpSchema.findOneAndUpdate({
          account_type: accountType,
          email,
          $or: [
            { last_sent_at: { $exists: false } },
            { last_sent_at: { $lte: new Date(now.getTime() - RESEND_COOLDOWN_MS) } },
          ],
        }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
      } catch (error) {
        if (error.code === 11000) {
          return response(false, "Please wait a minute before requesting another code.", 429, {
            fieldErrors: { email: "Please wait a minute before requesting another code." },
          });
        }
        throw error;
      }

      if (!otp) {
        return response(false, "Please wait a minute before requesting another code.", 429, {
          fieldErrors: { email: "Please wait a minute before requesting another code." },
        });
      }

      if (account) {
        try {
          await passwordResetOtpSchema.updateOne(
            { _id: otp._id },
            { $set: { code_hash: await bcrypt.hash(code, 10) } }
          );
          await sendPasswordResetCode(email, code);
        } catch (error) {
          await passwordResetOtpSchema.updateOne({ _id: otp._id }, { $unset: { code_hash: 1 } });
          console.error("Password reset email delivery failed:", error.message);
          return response(false, "Unable to send the reset code right now. Please try again later.", 503, {
            fieldErrors: { email: "Unable to send the reset code right now. Please try again later." },
          });
        }
      }

      return response(true, "If an account exists for this email, a reset code has been sent.");
    }

    if (action === "reset") {
      const { code, password, confirmPassword } = payload;
      if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
        return response(false, "Enter the six-digit code from your email.", 400, {
          fieldErrors: { code: "Enter the six-digit code from your email." },
        });
      }
      if (typeof password !== "string" || password.length < 4) {
        return response(false, "Use a password with at least 4 characters.", 400, {
          fieldErrors: { password: "Use a password with at least 4 characters." },
        });
      }
      if (password !== confirmPassword) {
        return response(false, "The passwords do not match.", 400, {
          fieldErrors: { confirmPassword: "The passwords do not match." },
        });
      }

      const now = new Date();
      const otp = await passwordResetOtpSchema.findOneAndUpdate({
        account_type: accountType,
        email,
        expires_at: { $gt: now },
        attempts: { $lt: MAX_OTP_ATTEMPTS },
        code_hash: { $exists: true },
        consumed_at: { $exists: false },
      }, { $inc: { attempts: 1 } }, { new: true }).select("+code_hash");
      if (!otp) {
        return response(false, "The code is invalid or expired. Request a new one.", 400, {
          fieldErrors: { code: "The code is invalid or expired. Request a new one." },
        });
      }
      if (!(await bcrypt.compare(code, otp.code_hash))) {
        const locked = otp.attempts >= MAX_OTP_ATTEMPTS;
        const message = locked
          ? "Too many incorrect attempts. Request a new code."
          : "The code is incorrect.";
        return response(false, message, locked ? 429 : 400, { fieldErrors: { code: message } });
      }

      const claimedOtp = await passwordResetOtpSchema.findOneAndUpdate({
        _id: otp._id,
        attempts: otp.attempts,
        expires_at: { $gt: now },
        consumed_at: { $exists: false },
      }, { $set: { consumed_at: now } }, { new: true });
      if (!claimedOtp) {
        return response(false, "The code is invalid or expired. Request a new one.", 400, {
          fieldErrors: { code: "The code is invalid or expired. Request a new one." },
        });
      }

      const account = await accountModel.findOne({ email });
      if (!account) {
        await passwordResetOtpSchema.deleteOne({ _id: otp._id });
        return response(false, "The code is invalid or expired. Request a new one.", 400, {
          fieldErrors: { code: "The code is invalid or expired. Request a new one." },
        });
      }

      account.password = await bcrypt.hash(password, 10);
      await account.save();
      await passwordResetOtpSchema.updateOne({ _id: otp._id }, {
        $unset: { code_hash: 1 },
        $set: { expires_at: new Date(Date.now() + OTP_LIFETIME_MS) },
      });
      return response(true, "Password reset successfully. You can now sign in.");
    }

    return response(false, "Unsupported password recovery action.", 400);
  } catch (error) {
    console.error("Password recovery failed:", error.message);
    return response(false, "Password recovery is unavailable right now.", 500);
  }
}
