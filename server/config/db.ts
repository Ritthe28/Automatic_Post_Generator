import mongoose from "mongoose";

const connectDB= async()=>{
try{
    mongoose.connection.on("connected",async()=>{
        console.log("Mongodb Connected");
        
    })
    await mongoose.connect(process.env.MONGODB_URI!)
}catch(e){
    console.error(e);
    process.exit(1);


    
}
}

export default connectDB;
