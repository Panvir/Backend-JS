console.log("✅ user.routes.js LOADED")
import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const router =Router();

router.route("/register").post(registerUser)//registerUser ethe controller hai controller basically method nu bolde ne

export default router