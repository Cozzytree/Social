import mongoose, { Mongoose } from "mongoose";
import { Comment } from "../models/comment.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const data = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $project: {
        username: 1,
        content: 1,
        "user.username": 1,
        "user._id": 1,
        "user.avatar": 1,
      },
    },
    {
      $skip: page - 1,
    },
    {
      $limit: parseInt(limit),
    },
  ]);
  if (!data) throw new ApiError(401, "error loading comments");

  return res.status(200).json(new ApiResponse("retrived comments", 200, data));
});

const addComment = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");

  const { content } = req.body;
  const { videoId } = req.params;

  const data = await Comment.create({
    content,
    video: videoId,
    owner: _id,
  });
  if (!data) throw new ApiError(501, "error while creating document");

  return res.status(200).json(new ApiResponse("We got the data", 200, data));
});

const addCommentTweet = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) {
    throw new ApiError(401, "unauthorized request");
  }

  const { tweetId } = req.params;
  const data = await Comment.create({ tweet: tweetId, owner: _id });
  if (!data) throw new ApiError(501, "error while tweeting");

  return res
    .status(200)
    .json(new ApiResponse("successfully tweeted", 201, data));
});

const updateComment = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");

  const { commentId } = req.params;
  const { content } = req.body;

  const data = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    { new: true }
  );
  if (!data) throw new ApiError(501, "error while updating comment");

  return res
    .status(200)
    .json(new ApiResponse("successfully updated", 200, data));
});

const deleteComment = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");

  const { commentId } = req.params;
  if (!commentId) throw new ApiError(401, "invalid Id");

  const data = await Comment.findOneAndDelete({ _id: commentId });
  if (!data) throw new ApiError(501, "error while deleting");

  return res.status(200).json(new ApiResponse("successfully deleted", 200, {}));
});

export {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  addCommentTweet,
};
