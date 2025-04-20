import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {User} from "../models/user.model.js"

//like video or unlike video
const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "This video id is not valid");
  }

  //find video already liked or not
  const videoLike = await Like.findOne({
    video: videoId,
  });

  let like;
  let unlike;
  //agr liked hai to unlike krdo delte krddo db se
  if (videoLike) {
    unlike = await Like.deleteOne({
      video: videoId,
    });

    if (unlike.deletedCount === 0) {
      throw new ApiError(500, "something went wrong while unlike video!!");
    }
  }else{
    //video liked nhi hai so create like
    like=await Like.create({
        video:videoId,
        likedBy:req.user._id
    })
        if(!like){
            throw new ApiError(500,"something went wrong while liking the video!!")
        }
  }

  //return response
  return res.status(200).json(
    new ApiResponse(200,{},`User ${like? "like": "unlike"} video successfully!!`)
  )

});

//comment like unlike method
const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  
  if(!isValidObjectId(commentId)){
    throw new ApiError(400,"This comment id is not valid")
  }

  //find of comment is liked ornot
  const commentLike= await Like.findOne({
    comment:commentId
  })

  let like
  let unlike

  if(commentLike){
    unlike=await Like.deleteOne({
      comment:commentId
    })

      if(unlike.deletedCount === 0){
        throw new ApiError(500,"something went wrong while unlike comment!!")
      }
  }else{
    //unlike krdo
    like= await Like.create({
      comment:commentId,
      likedBy:req.user._id
    })

    if(!like){
      throw new ApiError(500,"something went wrong while like comment!!")
    }
  }

  //return response
  return res.status(200).json(
    new ApiResponse(200,{},`User ${like? "like":"unlike"} comment successfully!!`)
  )
});

//like or unlike tweet
const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if(!isValidObjectId(tweetId)){
    throw new ApiError(400,"THis tweet id is not valid")
  }

  //find tweet already liked or not
  const tweetLike= await Like.findOne({
    tweet:tweetId
  })

  let like
  let unlike

  if(tweetLike){
    unlike=await Like.deleteOne({
      tweet:tweetId
    })

      if(unlike.deletedCount === 0){
        throw new ApiError(500,"Something went wrong while unlike comment!!")
      }
  }else{
    like=await Like.create({
      tweet:tweetId,
      likedBy:req.user._id
    })

    if(!like){
      throw new ApiError(500,"something went wrong while liking tweet!!")
    }
  }

  // return respnonse
  return res.status(200).json(
    new ApiResponse(200,{},`User ${like? "like":"unlike"} tweet succesfully!!`)
  )
  
});

//get liked videos
const getLikedVideos = asyncHandler(async (req, res) => {
  const userId=req.user._id
  if(!isValidObjectId(userId)){
    throw new ApiError(400,"This user id is not valid")
  }
  //find user in db
  const user=await User.findById(userId)
  if(!user){
    throw new ApiError(404,"User not found")
  }

  const likes=await Like.aggregate([
    {
      $lookup:{
        from:"videos",
        localField:"video",
        foreignField:"_id",
        as:"likedVideos",
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"videoOwner",
              foreignField:"_id",
              as:"videoOwner",
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
              videoOwner:{
                $arrayElemAt:["$videoOwner",0]
              }
            }
          }
        ]
      }
    }
  ])

  //return res
  const likedVideos = likes
  .map(like => like.likedVideos[0]) // extract actual video objects
  .filter(Boolean); // remove any null/undefined

return res.status(200).json(
  new ApiResponse(200, likedVideos, "Fetched liked videos successfully!")
)
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
