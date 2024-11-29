const { default: mongoose } = require("mongoose");

const orderModel = new mongoose.Schema({
    "user_id": mongoose.Schema.Types.ObjectId,
    "restaurant_id": mongoose.Schema.Types.ObjectId,
    "date": Date,
    "invoice_no": String,
    "total": Number,
    "shipping_charge": Number,
    "final_total": Number,
});

export const orderSchema = mongoose.models.orders
    || mongoose.model('orders', orderModel);