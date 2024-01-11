import mongoose, { Mongoose } from "mongoose";
import { Comment } from "../models/comment.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  //   const commentId = await Comment.findById({});

  const data = await Comment.aggregate([
    {
      $match: {
        video: videoId,
      },
    },
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req?.user?._id),
      },
    },
    {
      $project: {
        username: 1,
        content: 1,
      },
    },
    //     {
    //       $lookup: {
    //         from: "Video",
    //         localField: "video",
    //         foreignField: "_id",
    //         as: "comments",
    //       },
    //     },
    //     {
    //       $lookup: {
    //         from: "User",
    //         localField: "owner",
    //         foreignField: "_id",
    //         as: "owner",
    //       },
    //     },
    //     {
    //       $project: {
    //         comments: 1,
    //         woner: 1,
    //       },
    //     },
  ]);

  console.log(data);
  if (!data) throw new ApiError(401, "error loading comments");

  return res.status(200).json(new ApiResponse("retrived comments", 200, data));
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
});

export { getVideoComments, addComment, updateComment, deleteComment };
