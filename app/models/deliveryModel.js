const { default: mongoose } = require("mongoose");

const deliveryModel = new mongoose.Schema({
    "name":String,
    "phone":String,
    "password":String,
    "city":String,
    "address":String
});

export const deliverySchema = mongoose.models.delivery_partners ||
mongoose.model("delivery_partners", deliveryModel);