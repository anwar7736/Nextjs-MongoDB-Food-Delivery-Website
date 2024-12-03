const { default: mongoose } = require("mongoose");

const orderStatusModel = new mongoose.Schema({
   "name": String,
   "color": String,
   "status": Number,
});

export const orderStatusSchema = mongoose.models.order_statuses
   // || mongoose.model('order_statuses', orderStatusModel);