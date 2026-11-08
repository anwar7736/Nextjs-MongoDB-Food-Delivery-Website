const { default: mongoose } = require("mongoose");

const emailVerificationOtpModel = new mongoose.Schema({
    account_type: { type: String, enum: ["user", "delivery", "restaurant"], required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    code_hash: { type: String, select: false },
    expires_at: { type: Date, expires: 0 },
    last_sent_at: { type: Date },
    attempts: { type: Number, default: 0 },
    consumed_at: { type: Date },
});

emailVerificationOtpModel.index({ account_type: 1, email: 1 }, { unique: true });

export const emailVerificationOtpSchema = mongoose.models.email_verification_otps
    || mongoose.model("email_verification_otps", emailVerificationOtpModel);
