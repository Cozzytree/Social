import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ObjectId } from "mongodb";

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
    data = await Like.create({ comment: commentId, likedBy: _id });
  }
  if (ifLikeExist) {
    data = await Like.findOneAndDelete({ comment: commentId, likedBy: _id });
  }

  if (!data) throw new ApiError(401, "unknown");
  return res.status(200).json(new ApiResponse(`done`, 200, data));
});

const toggleReplyLikes = asyncHandler(async (req, res) => {
  const { replyId } = req.params;
  const { _id } = req.user;

  const ifLikeExist = await Like.findOne({
    reply: commentId,
    likedBy: _id,
  });

  let data;
  if (!ifLikeExist) {
    data = await Like.create({ reply: replyId, likedBy: _id });
  }
  if (ifLikeExist) {
    data = await Like.findOneAndDelete({ reply: replyId, likedBy: _id });
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
  return res
    .status(200)
    .json(new ApiResponse(`Success liked/Unliked`, 200, data));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const skip = (page - 1) * limit;
  const { _id } = req.user;
  if (!_id) {
    throw new ApiError(401, "unauthorized request");
  }

  const data = await Like.aggregate([
    {
      $match: {
        likedBy: new ObjectId(_id),
        video: { $exists: true },
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
      $lookup: {
        from: "users",
        localField: "likedVideos.owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$likedVideos",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        _id: "$likedVideos._id",
        title: "$likedVideos.title",
        duration: "$likedVideos.duration",
        thumbnail: "$likedVideos.thumbnail",
        videoFile: "$likedVideos.videoFile",
        views: "$likedVideos.views",
        createdAt: "$likedVideos.createdAt",
        user: {
          username: "$owner.username",
          avatar: "$owner.avatar",
          _id: "$owner._id",
        },
      },
    },
    {
      $facet: {
        videos: [{ $limit: limit }, { $skip: skip }],
        count: [{ $count: "count" }],
      },
    },
  ]);
  if (!data) throw new ApiError(404, "no videos found");
  const { videos, count } = data[0];
  return res
    .status(200)
    .json(new ApiResponse("success", 200, { videos, count: count[0] }));
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

export {
  toggleReplyLikes,
  toggleCommentLike,
  toggleTweetLike,
  getLikedVideos,
  toggleVideoLike,
  totalVideoLikes,
};
