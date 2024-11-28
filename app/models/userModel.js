const { default: mongoose } = require("mongoose");

const userModel = new mongoose.Schema({
    "name":String,
    "phone":String,
    "password":String,
    "address":String
});

export const userSchema = mongoose.models.users ||
mongoose.model("users", userModel);