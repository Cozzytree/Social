import { Video } from "../models/video.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { deleteImage } from "../utils/cloudinaryDelete.js";

export const uploadVideo = asyncHandler(async (req, res) => {
  //* Video file path
  let video, thumbnail;
  if (req.files?.videoFile) {
    video = req.files?.videoFile[0]?.path;
  }
  console.log(req.files);

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
  const thumbnailUrl = await uploadInCloudinary(thumbnail);

  //* video error handle
  if (!thumbnailUrl) {
    throw new ApiError(401, "tumbnail is required");
  }
  if (!videoUrl) {
    throw new ApiError(501, "Wasn't able to upload something went wrong");
  }

  //* create new document
  const data = await Video.create({
    videoFile: videoUrl,
    title: "Owl City - Real world",
    thumbnail: thumbnailUrl,
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

  await deleteImage(videoData?.videoPublicId);
  await deleteImage(videoData?.thumbnailPublicId);

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

  const data = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { title: res.body },
    },
    { new: true }
  );

  if (!data) throw new ApiError(501, "error while updating");

  return res.json(new ApiResponse("updated successfully", 200, data));
});

export const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
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
        title: 1,
        videoFile: 1,
        thumbnail: 1,
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
            $skip: (page - 1) * limit,
          },
          {
            $limit: limit,
          },
        ],
        totalCount: [
          {
            $count: "totalCount",
          },
        ],
      },
    },
    // {
    //   $skip: (page - 1) * limit,
    // },
    // {
    //   $limit: limit,
    // },
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
    throw new ApiError(501, "error while uploading");
  }

  const data = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: { thumbnail: newThumbnailUrl },
    },
    { new: true }
  );

  await deleteImage(oldUrl?.thumbnailPublicId);

  return res
    .status(200)
    .json(new ApiResponse("thumbnail udated successfully", 200, data));
});
