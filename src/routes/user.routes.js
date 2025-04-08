console.log("✅ user.routes.js LOADED")
import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
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
export default router
