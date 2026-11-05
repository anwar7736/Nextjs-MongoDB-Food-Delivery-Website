const { default: mongoose } = require("mongoose");

const passwordResetOtpModel = new mongoose.Schema({
    account_type: { type: String, enum: ["user", "delivery", "restaurant"], required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    code_hash: { type: String, select: false },
    expires_at: { type: Date, expires: 0 },
    last_sent_at: { type: Date },
    attempts: { type: Number, default: 0 },
    consumed_at: { type: Date },
});

passwordResetOtpModel.index({ account_type: 1, email: 1 }, { unique: true });

export const passwordResetOtpSchema = mongoose.models.password_reset_otps
    || mongoose.model("password_reset_otps", passwordResetOtpModel);
