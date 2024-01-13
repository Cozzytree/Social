import { Video } from "../models/video.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { deleteImage } from "../utils/cloudinaryDelete.js";
import mongoose from "mongoose";

export const uploadVideo = asyncHandler(async (req, res) => {
  //* Video file path
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
  const videoUrl = await uploadInCloudinary(video);
  const thumbnailUrel = await uploadInCloudinary(thumbnail);

  //* video error handle
  if (!thumbnailUrel) {
    throw new ApiError(401, "tumbnail is required");
  }
  if (!videoUrl) {
    throw new ApiError(501, "Wasn't able to upload something went wrong");
  }

  //* create new document
  const data = await Video.create({
    videoFile: videoUrl,
    title: "Owl City - Real world",
    thumbnail: thumbnailUrel,
    owner: _id,
  });

  //* check if document is created
  if (!data) throw new ApiError(501, "Error while uploading");

  return res
    .status(200)
    .json(new ApiResponse("succesfully uploaded", 200, data));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const user = req.user;

  const videoData = await Video.findById(videoId);
  console.log("video data", videoData);

  if (!user?._id.equals(videoData?.owner)) {
    throw new ApiError(401, "not the owner");
  }

  // if (!videoData) {
  //   throw new ApiError(404, "no video found to delete");
  // }

  const result = await deleteImage(videoData?.videoFile);
  console.log("result", result);

  const deleteVideo = await Video.findByIdAndDelete(videoId);

  return res.status(200).json(
    new ApiResponse("successfully deleted", 200, {
      deletedVideoId: deleteVideo?._id,
      title: deleteVideo?.title,
    })
  );
});

export const updateTitle = asyncHandler(async (req, res) => {
  const { username } = req.user;
  if (!username) throw new ApiError(401, "You are unauthorized to do so");

  const { videoId } = req.params;

  const data = await Video.findByIdAndUpdate(videoId, {
    $set: { title: res.body },
  });

  if (!data) throw new ApiError(501, "error while updating");

  return res.json(new ApiResponse("updated successfully", 200, data));
});

export const getAllVideos = asyncHandler(async (req, res) => {
  const data = await Video.aggregate([
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
        _id: 1,
        title: 1,
        videoFile: 1,
        thumbnail: 1,
        user: "$user.username",
        avatar: "$user.avatar",
      },
    },
  ]);

  return res.status(200).json(new ApiResponse("hehe", 200, data));
});

export const updateThumbnail = asyncHandler(async (req, res) => {
  const { username } = req.user;
  const { videoId } = req.params;

  if (!username) {
    throw new ApiError(401, "you are not authorized");
  }

  const oldUrl = await Video.findById(videoId).select("-videoFile -owner");
  console.log(oldUrl);

  const localThumbnailPath = req.file?.path;
  const newThumbnailUrl = await uploadInCloudinary(localThumbnailPath);
  if (!newThumbnailUrl) {
    throw new ApiError(501, "error while uploading");
  }

  const data = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { thumbnail: newThumbnailUrl },
    },
    { new: true }
  );

  const { result } = await deleteImage(oldUrl?.thumbnail);
  console.log("result", result);
  // if (result === "not found") {
  //   throw new ApiError(501, "error while updating tumbnail");
  // }
  return res
    .status(200)
    .json(new ApiResponse("thumbnail udated successfully", 200, data));
});
