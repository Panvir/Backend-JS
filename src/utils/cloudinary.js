import { v2 as cloudinary} from "cloudinary";
import fs from 'fs'//fs is file system eh already node de pckage ch hundi a added eh read,write,remove etc kranda km file system sara 

import { resolve } from "path";

 // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });
//agr local file path milgya tn eve krna hle local kive jari server te oh asi krna a koini
const uploadonCloudinary = async(localFilePath)=>{
    try{
        if(!localFilePath) return null // gl a j file path hini haiga bahr niklo sidga huh
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath, {
            resource_type:"auto"
        })

        //file has been uploaded succesfeully
        console.log("file hase been upload on cloudinary",response.url);
        //upload krk ulicnk kro file
        fs.unlinkSync(localFilePath)
        return response;
    }
    catch(error){
        //agr failhogya upload cloudinary te hi then asi server ch ki krni oh fille rakhke ki pta khrab filoe hoe
        fs.unlinkSync(localFilePath)//remice the locally saved temporary  file as upload op failed
        return null;
    }
}
 
export {uploadonCloudinary} 
   
    