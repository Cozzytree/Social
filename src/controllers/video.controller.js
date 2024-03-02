import { Video } from "../models/video.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { deleteImage } from "../utils/cloudinaryDelete.js";
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

export const uploadVideo = asyncHandler(async (req, res) => {
  //* Video file path
  const { title, description } = req.body;
  let video, thumbnail;
  if (req.files?.videoFile) {
    video = req.files?.videoFile[0]?.path;
  }

  if (req.files?.thumbnail) {
    thumbnail = req.files?.thumbnail[0]?.path;
  }

  //* user verification
  const { username, _id } = req?.user;

  //* Error handling
  if (!username) {
    throw new ApiError(401, "No active user");
  }
  if (!video) {
    throw new ApiError(401, "no video file found");
  }
  if (!thumbnail) {
    throw new ApiError(401, "please provide tumbnail");
  }

  //* upload in cloud
  const uploadVideoPromise = uploadInCloudinary(video);
  const uploadThumbnailPromise = uploadInCloudinary(thumbnail);

  //* video error handle  console.log(videoUrl, thumbnailUrl);
  const [videoRes, thumbnailRes] = await Promise.all([
    uploadVideoPromise,
    uploadThumbnailPromise,
  ]);

  const { secure_url: videoUrl, public_id: videoId, duration } = videoRes;
  const { secure_url: thumbnailUrl, public_id: thumbnailId } = thumbnailRes;

  if (!thumbnailUrl) {
    throw new ApiError(404, "couldnm't find the file");
  }
  if (!videoUrl) {
    throw new ApiError(404, "couldn't find the video");
  }

  //* create new document
  const data = await Video.create({
    videoFile: videoUrl,
    videoPublicId: videoId,
    thumbnailPublicId: thumbnailId,
    title: title,
    duration: duration,
    description: description || "",
    thumbnail: thumbnailUrl,
    owner: _id,
  });

  //* check if document is created
  if (!data) throw new ApiError(404, "video not found");

  return res
    .status(200)
    .json(new ApiResponse("succesfully uploaded", 201, data));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const user = req.user;

  const videoData = await Video.findById(videoId);

  if (user?._id !== videoData?.owner.toString()) {
    throw new ApiError(401, "not the owner");
  }

  await deleteImage(videoData?.videoPublicId);
  await deleteImage(videoData?.thumbnailPublicId);

  const deleteVideo = await Video.findByIdAndDelete(videoId);
  await Like.deleteMany({ video: videoId });
  await Comment.deleteMany({ video: videoId });

  return res
    .status(200)
    .json(new ApiResponse("successfully deleted", 200, deleteVideo));
});

export const updateVideoTandD = asyncHandler(async (req, res) => {
  const { username } = req.user;
  if (!username) throw new ApiError(401, "You are unauthorized");

  const { videoId } = req.params;

  const data = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: req.body,
    },
    { new: true }
  );

  if (!data) throw new ApiError(404, "not found");

  return res.json(new ApiResponse("updated successfully", 200, data));
});

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const data = await Video.aggregate([
    { $match: { isPublished: true } },
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
        foreignField: "video",
        as: "totalLikes",
      },
    },
    {
      $addFields: {
        totalLikes: {
          $size: "$totalLikes",
        },
      },
    },
    {
      $project: {
        _id: 1,
        duration: 1,
        title: 1,
        videoFile: 1,
        thumbnail: 1,
        views: 1,
        user: {
          id: "$user._id",
          username: "$user.username",
          avatar: "$user.avatar",
        },

        totalLikes: 1,
      },
    },
    {
      $facet: {
        data: [
          {
            $skip: +(page - 1) * limit,
          },
          {
            $limit: +limit,
          },
        ],
        totalCount: [
          {
            $count: "totalCount",
          },
        ],
      },
    },
  ]);

  return res.status(200).json(new ApiResponse("hehe", 200, data[0]));
});

export const updateThumbnail = asyncHandler(async (req, res) => {
  const { username } = req.user;
  const { videoId } = req.params;
  if (!username) {
    throw new ApiError(401, "you are not authorized");
  }

  const oldUrl = await Video.findById(videoId).select("-videoFile -owner");

  const localThumbnailPath = req.file?.path;
  const newThumbnailUrl = await uploadInCloudinary(localThumbnailPath);
  if (!newThumbnailUrl) {
    throw new ApiError(404, "couldn't find the uploaded file");
  }

  const data = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { thumbnail: newThumbnailUrl?.secure_url },
    },
    { new: true }
  );

  await deleteImage(oldUrl?.thumbnailPublicId);

  return res
    .status(200)
    .json(new ApiResponse("thumbnail udated successfully", 201, data));
});

export const getUserVideo = asyncHandler(async (req, res) => {
  // const { _id } = req.user;
  const { userId } = req.params;

  // if (!_id) throw new ApiError(401, "unauthorized request");

  const data = await Video.find({ owner: new mongoose.Types.ObjectId(userId) });
  if (!data) throw new ApiError(404, "not found");
  return res.status(200).json(new ApiResponse("success", 200, data));
});

export const getAVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const data = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "comments",
        foreignField: "video",
        localField: "_id",
        as: "videoComments",
      },
    },
    {
      $lookup: {
        from: "likes",
        foreignField: "video",
        localField: "_id",
        as: "videoLikes",
      },
    },
    {
      $addFields: {
        totalComments: {
          $size: "$videoComments",
        },
        totalLikes: {
          $size: "$videoLikes",
        },
      },
    },
    {
      $project: {
        _id: 1,
        createdAt: 1,
        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id || "", "$videoLikes.likedBy"] },
            then: true,
            else: false,
          },
        },
        owner: 1,
        thumbnail: 1,
        thumbnailPublicId: 1,
        title: 1,
        description: 1,
        duration: 1,
        updatedAt: 1,
        videoFile: 1,
        videoPublicId: 1,
        views: 1,
        totalComments: 1,
        totalLikes: 1,
      },
    },
  ]);

  // const data = await Video.findById({ _id: videoId });
  if (!data) throw new ApiError(401, "invalid id");

  return res.status(200).json(new ApiResponse("success", 200, data[0]));
});

export const updateView = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const data = await Video.findByIdAndUpdate(
    videoId,
    { $inc: { views: 1 } },
    { new: true }
  );
  return res.status(200).json(new ApiResponse("viewed", 200, data));
});

export const rocommendedVideos = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const data = await Video.aggregate([
    {
      $match: {
        _id: { $ne: new mongoose.Types.ObjectId(videoId) },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
      },
    },
    {
      $unwind: {
        path: "$owner",
        includeArrayIndex: "string",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        title: 1,
        thumbnail: 1,
        videoFile: 1,
        _id: 1,
        duration: 1,
        user: {
          username: "$owner.username",
          avatar: "$owner.avatar",
          id: "$owner._id",
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse("success", 200, data));
});

export const searchVideo = asyncHandler(async (req, res) => {
  const { q, filter, sort } = req.query;
  const regex = new RegExp(q, "i");
  console.log(regex, q);
  const data = await Video.aggregate([
    {
      $match: {
        title: regex,
      },
    },
    {
      $sort: { sort: 1 },
    },
  ]);
  return res.status(200).json(new ApiResponse("success", 200, data));
});
