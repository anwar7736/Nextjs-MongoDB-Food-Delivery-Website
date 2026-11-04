const { default: mongoose } = require("mongoose");

const orderStatusModel = new mongoose.Schema({
   "name": String,
   "color": String,
   "status": Number,
});

export const DEFAULT_ORDER_STATUS_ID = "674436ad7f3f886666bb47a7";

export const orderStatusSchema = mongoose.models.order_statuses
   || mongoose.model('order_statuses', orderStatusModel);