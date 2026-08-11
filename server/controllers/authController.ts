
import { Request,Response } from "express"
import { User } from "../models/user.js";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"
// Register User 
// post api/auth/register


const generateToken = (id:string )=>{
return jwt.sign({id},process.env.JWT_SECRET||"fallback_secret",{expiresIn:"30d"})
}
export const registerUser =async (req:Request,res:Response):Promise<void>=>{
try {
    const {name, email,password}= req.body;
    const userExists = await User.findOne({email});
    if (userExists) {
        res.status(400).json({
            message:"User Already Exists"

        })
        return;
    }
const salt = await bcrypt.genSalt(10);
const hashedPassword=await bcrypt.hash(password,salt);
const user =await User.create({
    name,email,password:hashedPassword
})
if (user) {
    res.json(201).json({_id:user._id,name:user.name ,email:user.email,tokenn:generateToken(user._id.toString())});

}else {
    res.status(400).json({
        message:"Invalid user data"
    })
}


} catch (error:any) {
    res.status(500).json({
        message:error?.message ||"Server Error "
    })
}
}

// user login
// post /api/auth/login


export const loginUser =async (req:Request,res:Response):Promise<void>=>{
try {
    const { email,password}= req.body;
    const user = await User.findOne({email});
    if (user &&(await bcrypt.compare(password,user.password)) ) {
       res.json(201).json({_id:user._id,name:user.name ,email:user.email,tokenn:generateToken(user._id.toString())});
    }else {
res.status(401).json({message:"Invalid email or password"})
    }

} catch (error:any) {
    res.status(500).json({
        message:error?.message ||"Server Error "
    })
}
}
