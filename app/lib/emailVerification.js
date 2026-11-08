import bcrypt from "bcryptjs";
import { emailVerificationOtpSchema } from "@/app/models/emailVerificationOtpModel";

const OTP_LIFETIME_MS = 10 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

export async function consumeEmailVerificationCode(accountType, email, code) {
  if (typeof code !== "string" || !/^\d{6}$/.test(code)) {
    return { success: false, status: 400, message: "Enter the six-digit code from your email." };
  }

  const now = new Date();
  const otp = await emailVerificationOtpSchema.findOneAndUpdate({
    account_type: accountType,
    email,
    expires_at: { $gt: now },
    attempts: { $lt: MAX_OTP_ATTEMPTS },
    code_hash: { $exists: true },
    consumed_at: { $exists: false },
  }, { $inc: { attempts: 1 } }, { new: true }).select("+code_hash");

  if (!otp) {
    return { success: false, status: 400, message: "The code is invalid or expired. Request a new one." };
  }

  if (!(await bcrypt.compare(code, otp.code_hash))) {
    const locked = otp.attempts >= MAX_OTP_ATTEMPTS;
    return {
      success: false,
      status: locked ? 429 : 400,
      message: locked ? "Too many incorrect attempts. Request a new code." : "The code is incorrect.",
    };
  }

  const claimedOtp = await emailVerificationOtpSchema.findOneAndUpdate({
    _id: otp._id,
    attempts: otp.attempts,
    expires_at: { $gt: now },
    consumed_at: { $exists: false },
  }, {
    $set: { consumed_at: now },
    $unset: { code_hash: 1 },
  }, { new: true });

  if (!claimedOtp) {
    return { success: false, status: 400, message: "The code is invalid or expired. Request a new one." };
  }

  return { success: true };
}

export async function createEmailVerificationCode(accountType, email, code, now = new Date()) {
  const update = {
    $set: {
      account_type: accountType,
      email,
      last_sent_at: now,
      expires_at: new Date(now.getTime() + OTP_LIFETIME_MS),
      attempts: 0,
    },
    $unset: { consumed_at: 1, code_hash: 1 },
  };

  const otp = await emailVerificationOtpSchema.findOneAndUpdate({
    account_type: accountType,
    email,
    $or: [
      { last_sent_at: { $exists: false } },
      { last_sent_at: { $lte: new Date(now.getTime() - 60 * 1000) } },
    ],
  }, update, { upsert: true, new: true, setDefaultsOnInsert: true });
  if (!otp) return null;

  const updated = await emailVerificationOtpSchema.updateOne(
    { _id: otp._id, last_sent_at: now },
    { $set: { code_hash: await bcrypt.hash(code, 10) } }
  );
  if (updated.modifiedCount === 0) {
    throw new Error("Unable to store the email verification code.");
  }
  return otp;
}
