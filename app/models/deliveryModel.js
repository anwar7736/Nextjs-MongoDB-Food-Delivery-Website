const { default: mongoose } = require("mongoose");

const deliveryModel = new mongoose.Schema({
    "name":String,
    "phone":String,
    "email":{type:String, lowercase:true, trim:true, unique:true, sparse:true},
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

export const deliverySchema = mongoose.models.delivery_partners ||
mongoose.model("delivery_partners", deliveryModel);