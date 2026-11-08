const { default: mongoose } = require("mongoose");

const assistantOrderRequestModel = new mongoose.Schema({
    checkout_id: { type: String, required: true, unique: true },
    expires_at: { type: Date, required: true },
});

assistantOrderRequestModel.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

export const assistantOrderRequestSchema = mongoose.models.assistant_order_requests
    || mongoose.model("assistant_order_requests", assistantOrderRequestModel);
