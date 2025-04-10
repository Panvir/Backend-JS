console.log("✅ user.routes.js LOADED")
import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router =Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1 // k kitni fils accept ktna
        }
    ]),//fields multiple firls eccept krda and array accept krda andr , also middleware controller to pehal pado
    registerUser)//registerUser ethe controller hai controller basically method nu bolde ne

router.route("/login").post(loginUser)

//secure routes
router.route("/logout").post(verifyJWT,logoutUser) //verifuJWT middleware hai then logout controller run hoega
router.route("/refresh-token").post(refreshAccessToken)//hume yaa verifyjwt vala middlware nhi laya kyoki asi controler ch hi decod elrea c km oh verify jwt ne krna c
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/current-user").get(verifyJWT,getCurrentUser)
router.route("/update-account").patch(updateAccountDetails)//post req ni pani kyoki ohtn sara bdlega pathc nl just jo chnagehoea ohi update hoega
router.route("/avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar) //upload single ie why in contrller too we wrttten user.file not files
router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile) //usrname is params c is just a route
router.route("/history").get(verifyJWT,getWatchHistory)



export default router
