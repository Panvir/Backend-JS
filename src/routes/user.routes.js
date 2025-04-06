console.log("✅ user.routes.js LOADED")
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
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

export default router