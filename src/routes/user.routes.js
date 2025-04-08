console.log("✅ user.routes.js LOADED")
import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
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
export default router