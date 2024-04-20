import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { ObjectId } from "mongodb";
import { Comment, Reply } from "../models/comment.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  let userId;
  if (req.user) {
    userId = req.user._id;
  } else {
    userId = null;
  }

  const data = await Comment.aggregate([
    {
      $match: {
        video: new ObjectId(videoId),
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
      $lookup: {
        from: "replies",
        localField: "_id",
        foreignField: "comment",
        as: "commentReplies",
      },
    },
    {
      $addFields: {
        repliesCount: { $size: "$commentReplies" },
        totalCommentLikes: { $size: "$commentLikes" },
      },
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        content: 1,
        repliesCount: 1,
        isLiked: {
          $cond: {
            if: {
              $and: [
                { $ifNull: [userId, false] },
                { $in: [new ObjectId(userId), "$commentLikes.likedBy"] },
              ],
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
  if (!data)
    throw new ApiError(404, "error while deleting or couldn;t find comment");

  await Reply.deleteMany({ comment: commentId });
  await Like.deleteMany({ comment: commentId });

  return res.status(200).json(new ApiResponse("successfully deleted", 200, {}));
});

//* tweets comments
const getTweetComments = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  let userId;
  if (req.user) {
    userId = req.user._id;
  } else {
    userId = null;
  }

  const data = await Comment.aggregate([
    {
      $match: {
        tweet: new ObjectId(tweetId),
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
      $lookup: {
        from: "replies",
        localField: "_id",
        foreignField: "comment",
        as: "commentReplies",
      },
    },
    {
      $addFields: {
        repliesCount: { $size: "$commentReplies" },
        totalCommentLikes: { $size: "$commentLikes" },
      },
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        content: 1,
        repliesCount: 1,
        isLiked: {
          $cond: {
            if: { $ifNull: ["$commentLikes.likedBy", []] },
            then: {
              $in: [new ObjectId(userId), "$commentLikes.likedBy"],
            },
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
  const { commentId } = req.params;
  const { content, replyTo } = req.body;

  const newReply = await Reply.create({
    owner: req.user._id,
    content,
    comment: commentId,
    replyTo,
  });

  if (!newReply) {
    throw new ApiError(500, "Failed to create reply. Please try again later.");
  }

  return res
    .status(201)
    .json(new ApiResponse("Reply added successfully.", 201, newReply));
});

const getReplies = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  if (!commentId) throw new ApiError(404, "invalid Id");
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

  let userId;
  if (req.user) {
    userId = req.user._id;
  } else {
    userId = null;
  }

  const data = await Reply.aggregate([
    { $match: { comment: new ObjectId(commentId) } },
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
        foreignField: "reply",
        as: "replyLikes",
      },
    },
    {
      $addFields: {
        totalLikes: { $size: "$replyLikes" },
      },
    },
    {
      $project: {
        content: 1,
        createdAt: 1,
        updatedAt: 1,
        "user.username": 1,
        "user._id": 1,
        "user.avatar": 1,
        isLiked: {
          $cond: {
            if: { $ifNull: ["$replyLikes.likedBy", []] },
            then: {
              $in: [new ObjectId(userId), "$replyLikes.likedBy"],
            },
            else: false,
          },
        },
      },
    },
    {
      $facet: {
        replies: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "total" }],
      },
    },
  ]);

  const { total, replies } = data[0];
  return res.status(200).json(
    new ApiResponse("success", 200, {
      total: total[0],
      replies,
    })
  );
});

const updateReply = asyncHandler(async (req, res) => {
  const { replyId } = req.params;
  const { content, replyTo } = req.body;
  const { _id } = req.user;

  const reply = await Reply.findByIdAndUpdate(replyId, {
    content,
    owner: _id,
    replyTo,
  });

  if (!reply) throw new ApiError(404, "error while commenting");

  return res.status(201).json(new ApiResponse("reply success", 201, reply));
});

const deleteReply = asyncHandler(async (req, res) => {
  const { replyId } = req.params;
  if (!replyId) throw new ApiError(404, "invalid id");
  const data = await Reply.findByIdAndDelete(replyId);
  if (!data) {
    throw new ApiError(404, "Error while deleting. Reply not found.");
  }
  await Like.deleteMany({ reply: replyId });

  return res
    .status(201)
    .json(new ApiResponse("successfully deleted", 201, null));
});

export {
  deleteReply,
  updateReply,
  getReplies,
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
