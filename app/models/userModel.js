const { default: mongoose } = require("mongoose");

const userModel = new mongoose.Schema({
    "name":String,
    "phone":String,
    "password":String,
    "address":String,
    "twoFactorEnabled":{type:Boolean, default:false},
    "twoFactorSecret":{type:String, select:false},
    "twoFactorPendingSecret":{type:String, select:false},
    "twoFactorLastUsedStep":{type:Number, default:-1},
    "twoFactorFailedAttempts":{type:Number, default:0},
    "twoFactorLockUntil":{type:Date, default:null}
});

export const userSchema = mongoose.models.users ||
mongoose.model("users", userModel);