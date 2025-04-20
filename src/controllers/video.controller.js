import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadonCloudinary} from '../utils/cloudinary.js'
import { response } from "express"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query=`/^video/`, sortBy = "createdAT", sortType = 1, userId = req.user._id} = req.query
    //TODO: get all videos based on query, sort, pagination
    //find user in db
    const user = await User.findById(
        {
            _id:userId
        }
    )

    if(!user){
        throw new ApiError(404,"user not found")
    }

    const getAllVideosAggregate= await Video.aggregate([
        {
            $match:{
                videoOwner:new mongoose.Types.ObjectId(userId),
                $or:[
                    {title:{$regex:query,$options:'i'}},
                    {description:{$regex:query,$options:'i'}}
                ]
            }
        },
        {
            $sort:{
                [sortBy]:sortType
            }
        },
        {
            $skip:(page -1)*limit
        },
        {
            $limit:parseInt(limit)
        }
    ])

    Video.aggregatePaginate(getAllVideosAggregate,{page,limit})
    .then((result)=>{
        return res
        .status(200)
        .json(
            new ApiResponse(
                200,result,"fetched all the video successfully!!"
            )
        )
    })
    .catch((error)=>{
        console.log("getting error while fetching all videos",error)
        throw error
    })
})

//publish video here
const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description,isPublished=true} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || title?.trim()===""){
        throw new ApiError(400,"Title content is required")
    }

    if(!description || description?.trim()===""){
        throw new ApiError(400,"Description content is required")
    }
    //local path
    const videoFileLocalPath=req.files?.videoFile?.[0].path
    const thumbnailFileLocalPath=req.files?.thumbnail?.[0].path

    if(!videoFileLocalPath){
        throw new ApiError(400,"video file missing!!")
    }

    //upload on cloudinary
    const videoFile=await uploadonCloudinary(videoFileLocalPath)
    const thumbnail=await uploadonCloudinary(thumbnailFileLocalPath)

    if(!videoFile){
        throw new ApiError(500,"something went wrong while uploading video file on cloudinary")
    }
    //store in db
    const video = Video.create({
        videoFile:{
            public_id:videoFile?.public_id,
            url:videoFile?.url
        },
        thumbnail:{
            public_id:thumbnail?.public_id,
            url:thumbnail?.url
        },
        title,
        description,
        isPublished,
        videoOwner: req.user._id,
        duration: videoFile?.duration
    })

    if(!video){
        throw new ApiError(500,"something went wrong while store the video is database")
    }

    //return the response
    return res.status(200).json(
        new ApiResponse(200,video,"Video uploaded successfully!!")
    )

})

//get video by id
const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"this video id is not valid")
    }
    const video= await Video.findById(
        {
            _id:videoId
        }
    )

    if(!video){
        throw new ApiError(404,"video not found")
    }

    //return response 
    return res.status(200).json(
        new ApiResponse(200,video,"video fetched successfully")
    )

})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const {title,description}=req.body
    const thumbnailFile=req.file?.path

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"this video id is not valid")
    }
    //if any field not provide
    if(!(thumbnailFile || !(!title || title?.trim()==="") || !(!description || description?.trim()===""))){
        throw new ApiError(400,"update field are required")
    }

    //find video
    const previousVideo = await Video.findOne(
        {
            _id:videoId
        }
    )
    if(!previousVideo){
        throw new ApiError(404,"Video not found")
    }

    let updateFields={
        $set:{
            title,
            description
        }
    }

    //if thumbnail provide dleete the previous one and upload new on
    let thumbnailUploadOnCloudinary;
    if(thumbnailFile){
        await deleteOnCloudinary(previousVideo.thumbnail?.public_id)

        //upload new onw
        thumbnailUploadOnCloudinary= await uploadonCloudinary(thumbnailFile);

        if(!thumbnailUploadOnCloudinary){
            throw new ApiError(500,"something went wrong while updating on cloudinary!!")
        }

        updateFields.$set={
            public_id:thumbnailUploadOnCloudinary.public_id,
            url:thumbnailUploadOnCloudinary.url
        }
    }

    const updatedVideoDetails = await Video.findByIdAndUpdate(
        videoId,
        updateFields,
        {
            new:true
        }
    )

    if(!updatedVideoDetails){
        throw new ApiError(500,"something went wrong while updating video details")
    }

    return res.status(200).json(
        new ApiResponse(200,{updatedVideoDetails},"Video details updated suceessfully")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"The video id is invalid")
    }
    //find video in db
    const video = await Video.findById({
        _id:videoId
    })

    if(!video){
        throw new ApiError(404,"video not found")
    }
    if(video.Owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"you dont have permission to delete this video!")
    }
    
    //delete video and thumbnail in cloudinary
    if(video.videoFile){
        await deleteOnCloudinary(video.videoFile.public_id,"video")
    }

    if(video.thumbnail){
        await deleteOnCloudinary(video.thumbnail.public_id)
    }

    const deleteResponse= await Video.findByIdAndDelete(videoId)

    if(!deleteResponse){
        throw new ApiError(500,"something went wrong while deleting the video!!")
    }

    // return respnse
    return res.status(200).json(
        new ApiResponse(200,deleteResponse,"video deleted successfully!!")
    )
})

//toggle publish status
const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"this video id is not valid")
    }

    //find video in db
    const video = await Video.findById({
        _id:videoId
    })

    if(!video){
        throw new ApiError(404,"Video not found")
    }

    if(video.Owner.toString() !== req.user._id.toString()){
        throw new ApiError(403,"you dont have permission to toggle this video!")
    }

    //toggle video status
    video.isPublished=!video.isPublished

    await video.save({validateBeforeSave:false})

    //return
    return res.status(200).json(
        new ApiResponse(200,video,"video toggle successfuly!!")
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}