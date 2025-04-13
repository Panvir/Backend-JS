import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import {uploadonCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { channel, subscribe } from "diagnostics_channel";

const generateAccessAndRefreshTokens= async(userId)=>{
  try{
    const user =await User.findById(userId)
    const accessToken= await user.generateAccesToken()
    const refreshToken =await user.generateRefreshToken()
//db ch store krata refresh token
    user.refreshToken=refreshToken
   await user.save({validateBeforeSave: false})
   //return krdo
   return {accessToken,refreshToken}

  }catch(error){
    throw new ApiError(500,"Something went wrong  while generating refresh and accrss token")
  }
}

// <------------------------register user-------------------------------->
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
  const { fullName, email, username, password } = req.body;//yaha extract kreya data
  // console.log("email :", email);

  //  if(fullName===""){
  //     throw new ApiError(400,"FUllname is requred") //apieroor apa clas bnai c utils ch
  //  } also can be done as
  if (
    [fullName, email, username, password].some((field) => field?.trim() === "") //eh check kreha k field koi khali tn ni ehna cho
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //ab user check kre hai already hai regiested k na
  const existedUser =await User.findOne({ //ye return krega first matching thing
    // email te username dono smae na kise nl 
    $or:[{username},{email}]
  })
  //agr hai already erroor dvo
  if(existedUser)
    {throw new ApiError(409,"User with this email and username already exists")}

  //avatar image te cover aimage
  // console.log(req.files); //for checkiing k ki ki anda upkoad hoge
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath=req.files?.coverImage[0].path; //path local storage ch lere abndr
  //? eh use krk eroors ange ktoki j na hoe undefuled jareha c coverimaglocal path ch 
  let coverImageLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)// isarrat dkehre a k array a v rahi hai and lenfht>0 hoe
    {
    coverImageLocalPath=req.files.coverImage[0].path;
  }

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


// <------------------------login user-------------------------------->
const loginUser= asyncHandler(async (req,res)=>{
  // pehle hum to dos likhage
  //1-> req-body se data le ayo
  //2-> username email use krk login
  //3-> find the user
  //4-> password check
  //5-> agr check hogya so access and refresh tojen bnega 
  //6->send cookie

  const {email,username,password}=req.body
  if (!username && !email) {
    throw new ApiError(400, "username or email is required")
}

  const user= await User.findOne({
    $or:[{username},{email}]//eh mongodb de iperator ne and or
  })

  if(!user){
    throw new ApiError(404,"User does not exist")
  }
  //agar milgya ferki krna password check kro
  const isPasswordValid= await user.isPasswordCorrect(password)//user eth eoh a jo hun login horeha t it will return true and false
  if(!isPasswordValid){
    throw new ApiError(401,"invalid user credentials")
  }

  const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id)
   
  //send in cookie now
  //baat hai humne just uoer rrefresh token paya a pr jo asi user leke ghumre a ohch tn update hoya hini hoega 
  //so here ya tn user ch hi add krdo ya davar db call mardo j lgda k expensive nhi call
  const loggedInUser= await User.findById(user._id).select("-password -refreshToken")
  // ab bhejege cookies
  const options={
    httpOnly:true, //ehde nl server nl hi modifi ho skdi a frontend throuh nhi hoegi
    secure:true
  }

  return res.status(200)
  .cookie("accessToken",accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(200,
      {user:loggedInUser,accessToken,refreshToken}, // ye data field hai jo apiRespons ch pai c
      "user Logged in Successfully"
    )
  )



})

  // <--------------------------------------logout USer------------------------------------>
  const logoutUser =asyncHandler(async(req,res)=>{
    //cookies clear kro and refrsh token v clear krna pena tn jake houga logout
    //hum middlewate use krage logout ch hum custom middleware krage use
  
    await User.findByIdAndUpdate(
      req.user._id , //eh .user authmiddleware cho aya
      {
        $unset :{ 
          refreshToken: 1//this will remove the field from document
        }
      },
      {
        new: true //ehde nl new value dikhayag after updated
      }
    )

    const options={
      httpOnly:true, //ehde nl server nl hi modifi ho skdi a frontend throuh nhi hoegi
      secure:true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200,{} , "User logged out successfully"))
    
    
  })

// <-----------------------------------refresh access token------------------------------------>
  // access token nu refresh krn da code likhre a
  const refreshAccessToken = asyncHandler(async (req,res)=>{
    //pehle cookies access kro
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
      throw new ApiError(401,"unauthorized request")
    }

    try {
      //ab verify kra reha
      const decodedToken=jwt.verify(
        incomingRefreshToken,
        process.env.REFRESH_TOKEN_SECRET
      )
  
     const user = await User.findById(decodedToken?._id)
     if(!user){
      throw new ApiError(401,"incvalid refresh token")
    }
    if(incomingRefreshToken !== user?.refreshToken)
    {
      throw new ApiError(401,"refresh toke in expird or ised")
    }
  
    //ahr march hogya so genrete new tokens
    const options={
      httpOnly:true,
      secure: true
    }
  
    const {accessToken,newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
  
    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",newrefreshToken,options)
    .json(
      new ApiResponse(200,{accessToken,newrefreshToken},"Acess Token refreshed")
    )
    } catch (error) {
      throw new ApiError(401,error?.message || "Invalid refresh token")
    }
  })

  // <---------------------ab chnage user pssword da controller likjde a------------------------->
const changeCurrentPassword = asyncHandler(async(req,res)=>{
  const {oldPassword,newPassword} = req.body
//pehla user lbi tnhi pass verify hou also gl hai password v ohi change kru jeda login hou already
const user = User.findById(req.user?._id)
const isPasswordCorrect= await user.isPasswordCorrect(oldPassword)

if(!isPasswordCorrect){
  throw new ApiError(400,"Invalid old password")
}

//new set kro
user.password= newPassword // ethe ape hash hoega kyoki method dekho model ch jake user da pre lgyaa hai ssave lyi so hash ape hoega
await user.save({validateBeforeSave:false}) 

return res.status(200)
.json(new ApiResponse(200,{},"Password changed successfully"))
})

//<-------------------------------getCurrentUser------------------------------------------------------->>>>>>>>>>
const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200).json(new ApiResponse(200,req.user,"current user fetched successfully"))//req.user ape chlega kyoki auth vele jo middleware chleya hai ohch req.user ch current user hai because in routes verify jwt runs in thath midlerware we had alread putter req.user - user
})
//<--------------------updateAccountDetails-------------->
const updateAccountDetails=asyncHandler(async(req,res)=>{
  const {fullName,email}=req.body
  if(!fullName || !email){
    throw new ApiError(400,"All fields are required")
  }

 const user=await User.findByIdAndUpdate(req.user?._id,{$set:{fullName:fullName,email:email}},{new:true}).select("-password")
 return res.status(200)
 .json(new ApiResponse(200,user,"Account detail updated successfully"))
})

//<<<<<<<<<<<<<<<<<<<<<<<<-------------------------updateUserAvatar-------------------------->>>>>>>>>>>>>
const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path

  if(!avatarLocalPath){
    throw new ApiError(400,"Avatar file is missing")
  }

  const avatar= await uploadonCloudinary(avatarLocalPath)

  if(!avatar.url){
    throw new ApiError(400,"Error while uploading new avatar")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        avatar:avatar.url
      }
    },
    {new:true}
  ).select("-password")
  return res.status(200).json(new ApiResponse(200,user,"avatar image updated successfully"))
})

//<---------------------updateusercoverimage--------------------------------->>>>>>>>>>>>>>>>
const updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400,"cover image file is missing")
  }

  const coverImage= await uploadonCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError(400,"Error while uploading new avatar")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage:coverImage.url
      }
    },
    {new:true}
  ).select("-password")

  return res.status(200).json(new ApiResponse(200,user,"Cover image updated successfully"))
})
// <-----------------------------getUserChannelprofile------------->>>>>>>>>>>>>
const getUserChannelProfile=asyncHandler(async(req,res) => {
  //hume channel tak jaen ka url milega params te
  const {username}=req.params //url to milda data params nl
  if(!username?.trim())
  {
    throw new ApiError(400,"username is missing")
  }

 //hum aggregation pipleine nl match krde 
const channel=await User.aggregate([
  {
    $match:{
      username:username?.toLowerCase()
    }
  },
  {
    $lookup:{
      from: "subscriptions", //ethe Subscription nhi ayega kyyoki mongo lowercase ch krd and plural ch rakhda naam
      localField:"_id",
      foreignField:"channel",
      as:"subscribers"
    }
  },
  {
    $lookup:{
      from: "subscriptions", //ethe Subscription nhi ayega kyyoki mongo lowercase ch krd and plural ch rakhda naam
      localField:"_id",
      foreignField:"subscriber",
      as:"subscribedTo"
    }
  },
  {
    $addFields:{//ehde nl fiedla add hundi additional
      subscribersCount:{
        $size:"$subscribers" //$tn aya subscriber agge kyoki hun oh field bn chuka ha ute
      },
      channelsSubscribedToCount:{
        $size:"$subscribedTo"
      },
      isSubscribed:{
        $cond :{
          if:{$in:[req.user?._id,"$subscribers.subscriber"]},
          then: true,
          else:false

        }
      }
    }
  },
  {
    $project:{
      fullName:1,
      username:1,
      subscribersCount:1,
      channelsSubscribedToCount:1,
      isSubscribed:1,
      avatar:1,
      coverImage:1,
      email:1


    }
  }
])
//return krake dekhea kro ki anda output

// agar channel hi nhi hai 
if(!channel?.length){
  throw new ApiError(404,"Channel does not exist")
}

return res.status(200).json(new ApiResponse(200,channel[0],"User channel fetched successfully"))
})

//<-----------------------------getWatchHistory---------------------->>>>>>>
const getWatchHistory=asyncHandler(async(req,res)=>{
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id),//ethe direst requse._id nhi c de skde kkyoki _id object ch store hundi hai te string i form ch mildi sanu tn ethe mongoose direclt km ni krda pipeline ch so sanu mngoose da eh methode likihna penda

      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[            // eh sub pipeline a
          {
            $lookup:{
              from:"users",
              localField:"owner",
              foreignField:"_id",
              as:"owner",
              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
              ]
            }
          },
          {
            $addFields:{
              owner:{
                $first:"$owner"
              }
            }
          }
        ]
      }
    }
  ])

  return res.status(200).json(
    new ApiResponse(200,user[0].watchHistory,"Wtch history fetched Succesfuly")
  )
})


export { registerUser,
          loginUser,
          logoutUser,refreshAccessToken,
          getCurrentUser,
          changeCurrentPassword,updateAccountDetails,
          updateUserAvatar,
          updateUserCoverImage,
          getUserChannelProfile,
          getWatchHistory
 };

 // Concept	Explanation
// Access Token	Self-contained token with user info
// Signed Using	ACCESS_TOKEN_SECRET (stored in .env)
// Verified Using	Same secret → makes sure token is authentic
