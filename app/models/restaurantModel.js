const { default: mongoose } = require("mongoose");

const restaurantModel = new mongoose.Schema({
    "name":String,
    "phone":String,
    "email":String,
    "password":String,
    "city":String,
    "address":String,
});

export const restaurantSchema = mongoose.models.restaurants ||
mongoose.model("restaurants", restaurantModel);