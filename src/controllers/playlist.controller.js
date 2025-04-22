import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"
import { Video } from "../models/video.model.js"


//---------------------------create playlist--------------------------------------
const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    if((!name || name?.trim()==="") || (!description || description?.trim()==="")){
        throw new ApiError(400,"Name and description both are required!!")
    }

    //creating playlist
    const playlist=await Playlist.create({
        name,
        description,
        owner:req.user._id
    })

    if(!playlist){
        throw new ApiError(500,"Something went wrong while creating playlist")
    }

    return res.status(200).json(
        new ApiResponse(200,playlist,"Playlist created successfully")
    )
    
})


//-----------------------get user playlist -----------------------------
const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    if(!isValidObjectId(userId)){
        throw new ApiError(400,"this is not valid user id")
    }

    //find user in db
    const user=await User.findById(userId)

    if(!user){
        throw new ApiError(404,"User not found")
    }

    //match and find all playlist
    const playlists=await Playlist.aggregate([
        {
            $match:{
                owner : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"Videos"
            }
        },
        {
            $addFields:{
                playlist:{
                    $first:"$Videos"
                }
            }
        }
    ])

    if(!playlists){
        throw new ApiError(500,"Something went wrong while fetching playlists")
    }

    return res.status(200).json(
        new ApiResponse(200,playlists,"Plalylist fetched successfully")
    )
})

//-------------------------getplaylistbyid-----------------------------------
const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    console.log("playlistId",playlistId)

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"This Playlist id is not valid")
    }

    //find playlistId in db
    const playlist=await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    return res.status(200).json(
        new ApiResponse(200,playlist,"playlist fetched successfully")
    )
})

//----------------------add video to playlist-------------------------------
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"This playlist id is not valid")
    }

    if(!isValidObjectId(videoId)){
        throw new ApiError(400,"This video is not valid")
    }

    //find playlist in db
    const playlist=await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"No playlist found!!")
    }

    if(playlist.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You dont have permission to add video in this playlist")
    }

    //find video in db
    const video = await Video.findById(videoId)

    //if video alreadyexist then?
    if(playlist.video.includes(videoId)){
        throw new ApiError(400,"video already exist in playlist")    
    }

    //push video to playlist
    const addedToPlaylist= await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push:{//because it is array so push operator
                video:videoId
            }
        },
        {
            new:true
        }
    )

    if(!addedToPlaylist){
        throw new ApiError(500,"something went wrong while added video to playlist")
    }

    return res.status(200).json(
        new ApiResponse(200,addedToPlaylist,"added video in the playlist successfully")
    )
})

//-----------------------------remove video from playlist---------------------
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
   if(!isValidObjectId(playlistId)){
    throw new ApiError(400,"this playlist id is not valid")
   }

   if(!isValidObjectId(videoId)){
    throw new ApiError(400,"This video id is not vallid")
   }

   const playlist=await Playlist.findById(playlistId)

   if(!playlist){
    throw new ApiError(404,"no playlist found")
   }

   if(playlist.owner.toString()!==req.user._id.toString()){
    throw new ApiError(403,"Ypu dont have permission to remove video in this playlist")
   }
   //find video in db
   const video = await Video.findById(videoId)

   if(!video){
    throw new ApiError(400,"Video doesnot exist in playlist")
   }
    
   //remove video from playlist
   const removeVideofromplaylist=await Playlist.findByIdAndDelete(
    playlistId,
    {
        $pull:{//because array field 

            video:videoId
        }
    },
    {
        new:true
    }
   )

   if(!removeVideofromplaylist){
    throw new ApiError(500,"SOmething went wrong while removing video from playlist")
   }

   return res.status(200).json(
    new ApiResponse(200,removeVideofromplaylist,"removed video from playlist succesfully")
   )

})

//--------------------------------delete playlist-------------------------
const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"This playlist id is not valid")
    }

    const playlist=await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(404,"no playlist found")
    }
    
    if(playlist.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"You dont have permission to delete this playlist")
    }

    const deleteplaylist=await Playlist.deleteOne({
        _id:playlistId
    })

    if(!deleteplaylist){
        throw new ApiError(500,"Something went wrong while delteling playlist")
    }

    return res.status(200).json(
        new ApiResponse(200,deleteplaylist,"Playlist deleted successfully!!")
    )

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {NewName, NewDescription} = req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400,"This playlist id is not valid")
    }

    //if any one is provided
    if(!((!NewName || NewName?.trim()==="") || (!NewDescription || NewDescription?.trim()===""))){
        throw new ApiError(400,"Either name or description is required")
    }else{

        const playlist = await Playlist.findById(playlistId)
        if(!playlist){
            throw new ApiError(404,"No playlist found")
        }

        if(playlist.owner.toString()!== req.user._id.toString()){
            throw new ApiError(403,"Ypu dont have permission to update this playlist")
        }

        const updateplaylist= await Playlist.findByIdAndUpdate(
            playlistId,
            {
                $set:{
                    name:NewName,
                    description:NewDescription
                }
            },
            {
                new:true
            }
        )

        if(!updatePlaylist){
            throw new ApiError(500,"Something went wrong shile updating playlist")
        }

        res.status(200).json(
            new ApiResponse(200,updateplaylist,"Playlist updated successfully!!")
        )
    }

    
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}