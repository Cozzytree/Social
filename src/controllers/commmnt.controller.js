import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { Comment } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
    { $unwind: "$user" },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "commentLikes",
      },
    },
    {
      $addFields: {
        totalCommentLikes: {
          $size: "$commentLikes",
        },
      },
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        username: 1,
        content: 1,
        isLiked: {
          $cond: {
            if: {
              $in: [req?.user?._id || "", "$commentLikes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
        totalCommentLikes: 1,
        "user.username": 1,
        "user._id": 1,
        "user.avatar": 1,
      },
    },
    {
      $skip: +page - 1,
    },
    {
      $limit: +limit,
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

//* tweets comments
const getTweetComments = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const data = await Comment.aggregate([
    {
      $match: {
        tweet: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "comment",
        as: "commentLikes",
      },
    },
    {
      $addFields: {
        totalCommentsLikes: {
          $size: "$commentLikes",
        },
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
    { $unwind: "$user" },
    {
      $project: {
        totalCommentsLikes: 1,
        isLiked: {
          $cond: {
            if: {
              $in: [req?.user?._id || "", "$commentLikes.likedBy"],
            },
            then: true,
            else: false,
          },
        },
        createdAt: 1,
        updatedAt: 1,
        username: 1,
        content: 1,
        "user.username": 1,
        "user._id": 1,
        "user.avatar": 1,
      },
    },
    {
      $skip: +page - 1,
    },
    {
      $limit: +limit,
    },
  ]);
  return res
    .status(200)
    .json(new ApiResponse("successfully fetched", 200, data));
});

const addTweetComment = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const { _id } = req.user;

  if (!_id) throw new ApiError(401, "unauthorized request");
  const data = await Comment.create({
    tweet: tweetId,
    content,
    owner: _id,
  });

  if (!data) throw new ApiError(501, "server error");
  return res
    .status(200)
    .json(new ApiResponse("successfully tweeted", 200, data));
});

const deleteTweetComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!req.user._id) throw new ApiError(401, "unverified user");

  await Comment.findByIdAndDelete(commentId);

  return res.status(200).json(new ApiResponse("successfully deleted", 200, {}));
});

const updateTweetComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;

  const data = await Comment.findByIdAndUpdate(
    commentId,
    { $set: { content } },
    { new: true }
  );
  return res
    .status(200)
    .json(new ApiResponse("successfully update", 200, data));
});

const replyComment = asyncHandler(async (req, res) => {
  const { commentId, content } = req.params;
  const updatedComment = await Comment.findByIdAndUpdate(
    commentId,
    { $push: { comments: content, owner: req.user._id } },
    { new: true }
  );
});

export {
  replyComment,
  getVideoComments,
  getTweetComments,
  addTweetComment,
  deleteTweetComment,
  updateTweetComment,
  addComment,
  updateComment,
  deleteComment,
};
