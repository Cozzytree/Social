import mongoose from "mongoose";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//* Add tweet
export const postTweet = asyncHandler(async (req, res) => {
  const { _id } = req?.user;
  if (!_id) throw new ApiError(401, "unknown user");

  const { content } = req.body;
  if (!content) throw new ApiError(401, "write something");

  const data = await Tweet.create([{ content, owner: _id }]);

  if (!data) throw new ApiError(401, "db error while uploading");
  return res
    .status(200)
    .json(new ApiResponse("sussecfully twetted", 201, data));
});

//*DELETE TWEET
export const deleteTweet = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");

  const { tweetId } = req.params;
  if (!tweetId) throw new ApiError(404, "invalid id");

  const Deltweet = await Tweet.findOneAndDelete({ _id: tweetId });

  await Like.deleteMany({ likedBy: _id, _id: tweetId });

  if (!Deltweet) throw new ApiError(404, "error  while deleting");

  return res.status(200).json(new ApiResponse("Successfully deleted", 204, {}));
});

//*Edit Tweet
export const editTweet = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");

  const { tweetId } = req.params;
  const { content } = req.body;

  const newContent = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content } },
    { new: true }
  );
  if (!newContent) throw new ApiError(401, "error while uploading");

  return res
    .status(200)
    .json(new ApiResponse("successfully updated", 201, newContent));
});

//* Get all tweets
export const getAllTweet = asyncHandler(async (req, res) => {
  const allTweets = await Tweet.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "totalLikes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "totalComments",
      },
    },

    {
      $addFields: {
        totalLikesCount: { $size: "$totalLikes" },
        totalCommentsCount: { $size: "$totalComments" },
      },
    },
    {
      $unwind: "$ownerInfo",
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        content: 1,
        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id || "", "$totalLikes.likedBy"] },
            then: true,
            else: false,
          },
        },
        tweets: 1,
        totalLikesCount: 1,
        totalCommentsCount: 1,
        ownerInfo: {
          _id: 1,
          username: 1,
          avatar: 1,
        },
      },
    },
  ]);
  if (!allTweets) throw new ApiError(404, "was't able to get tweets");

  return res
    .status(200)
    .json(new ApiResponse("here you have it", 200, allTweets));
});

export const getUserTweet = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const { userId } = req.params;
  const data = await Tweet.aggregate([
    {
      $match: { owner: new mongoose.Types.ObjectId(userId) },
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
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "likes",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $addFields: {
        totalLikesCount: { $size: "$likes" },
      },
    },
    {
      $project: {
        _id: 1,
        content: 1,
        totalLikesCount: 1,
        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id || "", "$likes.likedBy"] },
            then: true,
            else: false,
          },
        },
        ownerInfo: {
          username: "$user.username",
          avatar: "$user.avatar",
          _id: "$user._id",
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $facet: {
        data: [{ $skip: (page - 1) * limit }, { $limit: limit }],
        totalCount: [{ $count: "totalCount" }],
      },
    },
    {
      $unwind: "$totalCount",
    },
    {
      $project: {
        data: 1,
        totalCount: "$totalCount.totalCount",
      },
    },
  ]);

  if (!data) {
    throw new ApiError(404, "database error while retrieving data");
  }

  return res
    .status(200)
    .json(new ApiResponse("Here are the tweets", 200, data));
});

// get a tweet
export const getAtweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const data = await Tweet.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(tweetId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "tweet",
        as: "totalLikes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "tweet",
        as: "totalComments",
      },
    },

    {
      $addFields: {
        totalLikesCount: { $size: "$totalLikes" },
        totalCommentsCount: { $size: "$totalComments" },
      },
    },
    {
      $unwind: "$ownerInfo",
    },
    {
      $project: {
        createdAt: 1,
        updatedAt: 1,
        content: 1,
        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id || "", "$totalLikes.likedBy"] },
            then: true,
            else: false,
          },
        },
        tweets: 1,
        totalLikesCount: 1,
        totalCommentsCount: 1,
        ownerInfo: {
          _id: 1,
          username: 1,
          avatar: 1,
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse("success", 200, data[0]));
});
