


import { GoogleGenAI } from "@google/genai";

import {Response} from "express"
import { AuthRequest } from "../middleware/authMiddleware.js";
import axios from "axios";
import { cloudinary } from "../config/cloudinary.js";
import { Generation } from "../models/Generation.js";
import { Post } from "../models/Post.js";
import { resolve } from "node:dns";



// helper to poll Leonardo.ai 

const pollLeonardoJob= async (generationId:string, apiKey:string):Promise<string>=>{
   const maxRetries= 20 ;
   const delay = 5000;
   for(let i=0;i<maxRetries;i++){
      try{

         const responce = await axios.get(`https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,{
            headers:{
accept:"application/json",authorization:`Bearer ${apiKey}`}})

const generation= responce.data.generations_by_pk;
  if (generation.status==="COMPLETE") {
   if (generation.generated_images && generation.generated_images.length>0) {
      return generation.generated_images[0].tempUrl

   }
   throw new Error("Generation complete but no image found");

  }
if (generation.status==="FAILED") {
   throw new Error("Leonardo.ai generation failed")
}
      }catch(e:any){
    console.log("Polling error:",e?.responce.data||e.message);
    
      }
      await new Promise((resolve)=>setTimeout(resolve,delay));

   }
   throw new Error("leonardo Image generation timed out ")
}


// Generate Post 
// /api/posts/generations
export const generatePost =async(req:AuthRequest,res:Response):Promise<void>=>{
   try {
     const {prompt,tone,generateImage}= req.body;
     const apiKey = process.env.GEMINI_API_KEY;
     if (!apiKey) {
        res.status(400).json({
            message :"Gemini API key is missing please add it to your server/.env file"
        })
     }
     const ai = new GoogleGenAI({apiKey});
// generate Text 

       const textResponce = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a social Media post based on this prompt:"${prompt}". Tone:${tone},
      Include Relavant Hashtags.
      Formate the responce as JSON with "content" and "imagePrompt" fields.
      The "imagePrompt should be a highly descriptive prompt for an image generator the completes the post "
      `,
    });

    let  content = "";
    let imagePrompt = prompt;

try {
   const rawText = textResponce.text||"";
   const jsonMatch= rawText.match(/\{[\s\s]*\}/);
   const data =jsonMatch?JSON.parse(jsonMatch[0]):{content:rawText,imagePrompt:prompt}
    content=data.imagePrompt;

} catch (error) {
   content= textResponce.text||"";
   
}

let MediaUrl= "";
if (generateImage) {

   try {
      
      const leonardoKey = process.env.LEONARDO_API_KEY;
      if (leonardoKey) {
         // use leonardo.ai  for image generation 
         const leoResponce = await axios.post("https://cloud.leonardo.ai/api/rest/v2/generations",{
            "public": false,
       "model": "gpt-image-2",
       "parameters":{
         "quality": "LOW",
           "prompt": imagePrompt,
           "quantity": 1,
           "width": 1024,
           "height": 1024,
           "prompt_enhance": "OFF"
       }
         },{headers:{
            accept :"application/json",
            authorization:`Bearer ${leonardoKey}`,
            "content-type":"application/json",
         }})

         const generationId = leoResponce.data.generate.generationId;
         const tempUrl = await pollLeonardoJob(generationId,leonardoKey)

         // upload to Cloudinary for persistence 
         const uploadResult = await cloudinary.uploader.upload(tempUrl,{folder:"Ai-generations"});
         MediaUrl= uploadResult.secure_url;

      }
   } catch (error:any) {
console.log("Image generation failed:",error);
     
   }
   
}

// save generations toDB
const generation= await Generation.create({
   user:req.user._id,
   prompt,
   content,
   mediaUrl:MediaUrl,
   mediaType:MediaUrl?"image":undefined,
   tone  
})
res.json(generation);

   } catch (error :any) {
    res.status(500).json({message:error?.message||"server Error"})
   }
}
// Get Generations 
// /api/posts/generate
export const getGenerations =async(req:AuthRequest,res:Response):Promise<void>=>{

try {
   const generations = await Generation.find({
      user:req.user._id}).sort({createdAt:-1})
res.json(generations);

}catch (error :any) {
    res.status(500).json({message:error?.message||"server Error"})
}
}
// Get Generations 
// /api/postes/posts
export const getPosts =async(req:AuthRequest,res:Response):Promise<void>=>{
try {
   
   const posts = await Post.find({user:req.user._id})
   res.json(posts);

} catch (error:any ) {
     res.status(500).json({message:error?.message||"server Error"})
}
}
// Get Generations 
// /api/postes/posts
export const schedulePost =async(req:AuthRequest,res:Response):Promise<void>=>{

   try {
      const {content, platforms , scheduledFor,status}= req.body ;
      // parse platforms if it comes as a stringfied array from formdata 

      let parsedPlatforms = platforms;
      if (typeof platforms=== "string") {
         try {
            parsedPlatforms = JSON.parse(platforms);

         } catch (error :any) {
            parsedPlatforms =platforms.split(",");

         }
      }
  
    let mediaUrl:string|undefined =  req.body.mediaUrl;
    let mediaType: "image"|"video"|undefined= req.body.mediaType;

    if (req.file ) {
       const result = await new Promise<any>((resolve, reject)=>{
         const stream = cloudinary.uploader.upload_stream({resource_type:"auto",folder:"social-scheduler"},(error, result)=>{
            if (error) reject(error) ;
            else resolve(result);

         })
         stream.end(req.file!.buffer);

       })
       mediaUrl= result.secure_url;
       mediaType= result.resource_type==="video"?"video":"image";
         }
         const post = await Post.create({
            user : req.body._id,
            content,
            platform:parsedPlatforms,
            mediaUrl,
            mediaType,
            scheduledFor,
            status
         })
res.status(201).json(post);


   } catch (error:any) {
       res.status(500).json({message:error?.message||"server Error"})
   }
}

