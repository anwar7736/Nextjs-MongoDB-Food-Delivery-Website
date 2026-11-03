const { default: mongoose } = require("mongoose");

const restaurantModel = new mongoose.Schema({
    "name":String,
    "email":String,
    "phone":String,
    "password":String,
    "city":String,
    "address":String,
    "twoFactorEnabled":{type:Boolean, default:false},
    "twoFactorSecret":{type:String, select:false},
    "twoFactorPendingSecret":{type:String, select:false},
    "twoFactorLastUsedStep":{type:Number, default:-1},
    "twoFactorFailedAttempts":{type:Number, default:0},
    "twoFactorLockUntil":{type:Date, default:null}
});

export const restaurantSchema = mongoose.models.restaurants ||
mongoose.model("restaurants", restaurantModel);