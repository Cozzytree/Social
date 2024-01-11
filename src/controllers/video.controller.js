import { Video } from "../models/video.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { deleteImage } from "../utils/cloudinaryDelete.js";
import mongoose from "mongoose";

export const uploadVideo = asyncHandler(async (req, res) => {
  //* Video file path
  const video = req.file?.path;

  //* user verification
  const { username, _id } = req?.user;

  //* Error handling
  if (!username) throw new ApiError(401, "No active user");
  if (!video) throw new ApiError(401, "no video file found");

  //* upload in cloud
  const videoUrl = await uploadInCloudinary(video);

  //* video error handle
  if (!videoUrl)
    throw new ApiError(501, "Wasn't able to upload something went wrong");

  //* create new document
  const data = await Video.create({
    videoFile: videoUrl,
    title: "Owl City - Real world",
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
