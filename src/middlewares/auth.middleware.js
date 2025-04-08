import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";
//middlewate ch next lana na bhukea kro
export const verifyJWT = asyncHandler(async(req,_,next)=>{ //_ res di jgah kyoki res tn use nhi hoya kite code ch
    //req cho cookies cho access lvage accestoken da use de base te hi tn asi logout krage
   try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
 
    if(!token){
     throw new ApiError(401,"Unauthorized request")
    }
    //jo humne jwt token da method bnaya c user.model ch ohde ch asi return v bda kuch krea c oh sab decode krage hun asi
    
    const decodedToken=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
 
   const user=  await User.findById(decodedToken?._id).select("-refreshToken -password")
 
   if(!user){
     // next video ch we will discuss about frontend
     throw new ApiError(401,"Inavalid access token")
   }
   //agar yaaha agya ehda mtb user haiga
   req.user=user;//right vala user uto aya left vala user bs naam just oh koi khaas cheej nhi a
   next()
   } catch (error) {
    throw new ApiError(401,error?.messsage || "Inavalid access token")
   }
})