

// Get All Accounts 
// GET/api/accounts

import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { Account } from "../models/account.js";
import zernio from "../config/zernio.js";


export const getAccounts = async (req: AuthRequest, res:Response):Promise<void>=>{
try {
  const accounts=  await Account.find({user:req.user._id})
  res.json(accounts)
} catch (error :any ) {
    res.json ({message:error?.message || "server Error"})
}

}

// Add Account 
// Post /api/accounts 

export const addAccount = async (req: AuthRequest, res:Response):Promise<void>=>{
try {
    const {platform,handle ,avatarUrl}= req.body ;

  const account=  await Account.create({user:req.user._id,platform , avatarUrl})
  res.status(201).json(account)
} catch (error :any ) {
    res.json ({message:error?.message || "server Error"})
}

}



// Disconnect Account 


export const disconnectAccount = async (req: AuthRequest, res:Response):Promise<void>=>{
try {
  const account = await Account.findOne({_id:req.params.id,  user:req.user._id})
  if(!account){
    res.status(404).json({message:"Account Not found"})
    return 
  }
  if (account.zernioAccountId) {
    try {
        await zernio.accounts.deleteAccount({path:{accountId:account.zernioAccountId}})
    } catch (error:any) {
        res.status(500).json({
            message :error?.responce?.data?.message || error?.message 
        })
        return
    }
  }
  await account.deleteOne();
  res.json({
    message :"Account disconnected successfully"
  })
} catch (error :any ) {
    res.json ({message:error?.message || "server Error"})
}

}


