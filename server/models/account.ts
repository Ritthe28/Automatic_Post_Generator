import mongoose from "mongoose"

const accountSchema = new mongoose.Schema({
    user :{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    platform :{type:String,enaum :["twitter","linkedIn","facebook","instagram","facebook_page","linkedin_page","instagram_business"],required:true },
    zernioAccountId:{type:String},
    accessToken:{type:String},
    refreshToken:{type:String},
    tokenExpiredAt:{type:String},
    status :{type:String,enum :["connected","disconnected"],default:"connected"},
    avatarUrl: {type:String}

},{timestamps:true})

export const Account= mongoose.model("Account",accountSchema);
