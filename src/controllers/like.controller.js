import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "no user active");

  //* check if liked
  const ifLikeExist = await Like.findOne({
    video: videoId,
    likedBy: _id,
  });

  let data;
  if (!ifLikeExist) {
    data = await Like.create([{ video: videoId, likedBy: _id }]);
  }
  if (ifLikeExist) {
    data = await Like.findOneAndDelete({ video: videoId, likedBy: _id });
  }

  if (!data) throw new ApiError(401, "unknown");
  return res.status(200).json(new ApiResponse(`done`, 200, data));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { _id } = req.user;

  if (!_id) throw new ApiError(401, "no user active");

  //* check if liked
  const ifLikeExist = await Like.findOne({
    comment: commentId,
    likedBy: _id,
  });

  let data;
  if (!ifLikeExist) {
    data = await Like.create([{ comment: commentId, likedBy: _id }]);
  }
  if (ifLikeExist) {
    data = await Like.findOneAndDelete({ comment: commentId, likedBy: _id });
  }

  if (!data) throw new ApiError(401, "unknown");
  return res.status(200).json(new ApiResponse(`done`, 200, data));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  const { _id } = req.user;

  if (!_id) throw new ApiError(401, "no user active");

  //* check if liked
  const ifLikeExist = await Like.findOne({
    tweet: tweetId,
    likedBy: _id,
  });

  let data;
  if (!ifLikeExist) {
    data = await Like.create([{ tweet: tweetId, likedBy: _id }]);
  }
  if (ifLikeExist) {
    data = await Like.findOneAndDelete({ tweet: tweetId, likedBy: _id });
  }

  if (!data) throw new ApiError(401, "unknown");
  return res.status(200).json(new ApiResponse(`done`, 200, data));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!id) {
    throw new ApiError(401, "unauthorized request");
  }

  const data = await Like.aggregate([
    {
      $match: {
        likedBy: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
      },
    },
    {
      $unwind: "$likedVideos",
    },
    {
      $lookup: {
        from: "users",
        localField: "likedVideos.owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    {
      $project: {
        _id: 1,
        video: 1,
        likedBy: 1,
        "likedVideos.videoFile": 1,
        "likedVideos.thumbnail": 1,
        "likedVideos.title": 1,
        "likedVideos.views": 1,
        "likedVideos.createdAt": 1,
        "ownerInfo.username": 1,
      },
    },
  ]);
  if (!data) throw new ApiError(501, "error while fetching");

  return res.status(200).json(new ApiResponse("here we are", 200, data));
});

const totalVideoLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { _id } = req.user;

  const data = await Like.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
  ]);

  return res.status(200).json(new ApiResponse("success", 200, { data, _id }));
});

export { toggleCommentLike, toggleTweetLike, getLikedVideos, toggleVideoLike };
