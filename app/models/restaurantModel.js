const { default: mongoose } = require("mongoose");

const restaurantModel = new mongoose.Schema({
    "name":String,
    "email":{type:String, lowercase:true, trim:true, unique:true, sparse:true},
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