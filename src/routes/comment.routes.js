import { Router } from "express";
import {getVideoComments,
    addComment,
    updateComment,
    deleteComment} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router()

router.use(verifyJWT)//to apply in all

router.route("/video/:videoId").get(getVideoComments).post(addComment)
router.route("/video/:commentId").delete(deleteComment).patch(updateComment)

export default router