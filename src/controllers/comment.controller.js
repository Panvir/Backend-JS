import mongoose, { isValidObjectId } from "mongoose";
import {Comment} from "../models/comment.model.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";

const getVideoComments=asyncHandler(async(req,res)=>{
    //todo: get all comments for a video
    const {videoId}=req.params
    const {page=1,limit=10}=req.query

    if(!isValidObjectId(videoId)){
        throw new ApiError(404,"Video id not valid !!")
    }
    //find video in database
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    //match and finds all the comments
    const aggregateComments =[
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                { $project: { username: 1, avatar: 1 } }
              ]
            }
          },
          {
            $unwind:"$owner"
          }
    ]

    Comment.aggregatePaginate(Comment.aggregate(aggregateComments), {
        page,
        limit
      })
    .then((result)=>{
        return res.status(200).json(
            new ApiResponse(200,result,"VideoComments fetched successfully!!")
        )
    })
    .catch((error)=>{
        throw new ApiError(500,"Somthing went wrong while fetching video Comments!!",error)
    })

})

//add comment to video
const addComment=asyncHandler(async(req,res)=>{
    //todo: add a comment to a video
    const {comment}= req.body
    const {videoId}= req.params

    console.log("req body", req.body)
    console.log("comment ", comment)

    if( !comment || comment?.trim()===""){
        throw new ApiError(400,"comment is required")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"This video id is not valid")
    }

    const VideoComment=await Comment.create({
        content:comment,
        video: videoId,
        owner: req.user._id
    })
    if(!VideoComment){
        throw new ApiError(500,"something went wrong while creating video comment")
    }
    //return response
    return res.status(200).json(
        new ApiResponse(200,VideoComment,"video comment created succfully!")
    )

})

//update a comment to videp
const updateComment = asyncHandler(async(req,res)=>{
    //todo: update a comment
    const {newContent}=req.body
    const {commentId}=req.params

    if(!newContent || newContent?.trim()===""){
        throw new ApiError(400,"Content is required")
    }

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"this video id is not valid")
    }

    const comment= await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"Comment not found")
    }

    if(comment.owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"You dont have permission to update this comment")
    }

    const updatecomment= await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:newContent
            }
        },
        { 
            new:true
        }
    )

    if(!updatecomment){
        throw new ApiError(500,"SOmething went wwrong while updating comment")
    }

    //return res
    return res.status(200).json(
        new ApiResponse(200,updatecomment,"COmmetn updated successfully!!")
    )
})

//delete comment to video
const deleteComment = asyncHandler(async(req,res)=>{
    //todo: delete a comment
    const {commentId}= req.params

    if(!isValidObjectId(commentId)){
        throw new ApiError(400,"this video id is not valid")
    }

    const comment= await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(404,"comment not found")
    }

    if(comment.owner.toString()!== req.user._id.toString()){
        throw new ApiError(403, " You dont have permission to delete this comment")
    }

    const deletecomment = await Comment.deleteOne(req.user._id)

    if(!deletecomment){
        throw new ApiError(500,"Something went wrong while deleting comment")
    }

    //return respinse
    return res.status(200).json(
        new ApiResponse(200,deletecomment,"comment deleted successfully")
    )
})

export{
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}