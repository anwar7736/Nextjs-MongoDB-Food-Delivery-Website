const { default: mongoose } = require("mongoose");

const orderItemModel = new mongoose.Schema({
   "order_id": mongoose.Schema.Types.ObjectId,
   "food_id": mongoose.Schema.Types.ObjectId,
   "quantity": Number,
   "price": Number,
   "total": Number,
});

export const orderItemSchema = mongoose.models.order_items
   || mongoose.model('order_items', orderItemModel);