const { default: mongoose } = require("mongoose");

const orderStatusLogModel = new mongoose.Schema({
   "order_id": mongoose.Schema.Types.ObjectId,
   "status_id": mongoose.Schema.Types.ObjectId,
   "date": Date,
});

export const orderStatusLogSchema = mongoose.models.order_status_logs
   || mongoose.model('order_status_logs', orderStatusLogModel);