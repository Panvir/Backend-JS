import { asyncHandler } from "../utils/asyncHandler.js"

//user register da code likhre hai te async hadnler nl asi baar baar try catch ni pana pyu tn krk use reya te bnaya c asi 
const registerUser = asyncHandler( async(req,res)=>{
  
     res.status(200).json({
        message:"working ok"
    })
})

export {registerUser,}