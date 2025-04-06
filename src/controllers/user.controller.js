import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadonCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";



//user register da code likhre hai te async hadnler nl asi baar baar try catch ni pana pyu tn krk use reya te bnaya c asi
const registerUser = asyncHandler(async (req, res) => {
  //get user details from frontend
  //validation k email correct format hai kit empty tn ni kuch
  //check if user already exists:username,email
  //check for images,check for avatar
  //upload them to cloudinary, avatar
  // 1-create user object  kyoki mongo object hi lenda a -create entry in db
  //remove password and refresg token field from response
  //check for user cration
  //return res agr create hofya hai agar ngi hua error dedo

  //req body url etc to a skdi hai  url vala badhc dekhage
  const { fullName, email, username, password } = req.body;
  console.log("email :", email);

  //  if(fullName===""){
  //     throw new ApiError(400,"FUllname is requred") //apieroor apa clas bnai c utils ch
  //  } also can be done as
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "") //ehmtlb field eh trim krk true areha tn ki?
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //ab user check kre hai already hai regiested k na
  const existedUser = User.findOne({ //ye return krega first matching thing
    // email te username dono smae na kise nl 
    $or:[{username},{email}]
  })
  //agr hai already erroor dvo
  if(existedUser){409,"User with this email and username already exists"}

  //avatar image te cover aimage
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath=req.files?.coverImage[0].path; //path local storage ch lere abndr

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar image is needed")
  }
  
  //ab cloudinary te kro
 const avatar=await  uploadonCloudinary(avatarLocalPath)
 const coverImage= await uploadonCloudinary(coverImageLocalPath)
if(!avatar){
    throw new ApiError(400,"Avatar image is needed")
}

//db ch store jrage kyoki user model de thrigh gl kre hai asi db nl
const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage:coverImage?.url || "", //coverimage compulsory nhi hai j hoi tn url pado nhi tn khali
    email,
    password,
    username:username.toLowerCase()
})

//but gl kya bneya v hai user j bneya hai tn id nl find krk dekhlo _id field ape pauga mongodb ehch and remove pass etc kr skda ehde nl hi
const createdUser= await User.findById(user._id).select(
    "-password -refreshToken" // ethe oh jo nhi chide remove
)

// ab asli check hoega
if(!createdUser){
    throw new ApiError(500,"Something went wrong while registering")
}

//hum chahte hai api repsnse bhejde 

return res.status(201).json(
    //jo resonse class bnai a ohnu krage use te new object bnauge oh class da
    new ApiResponse(200,createdUser,"User Registered Successfully") // eh postman te ayega 
)


});

export { registerUser };
