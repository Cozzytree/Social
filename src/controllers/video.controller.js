import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import mongoose from "mongoose";
import crypto from "crypto";
import { Playlist } from "../models/playlist.model.js";
import { User } from "../models/user.model.js";
import { tokens } from "../middleware/tokenBucket.js";
import { Video } from "../models/video.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { deleteImage } from "../utils/cloudinaryDelete.js";
import { Comment } from "../models/comment.model.js";
import { ObjectId } from "mongodb";
import { Like } from "../models/like.model.js";

const uploadStatusMap = new Map();

export const uploadVideo = asyncHandler(async (req, res) => {
  //* Video file path
  if (!req.token) {
    return res.status(503).json(new ApiResponse("server busy", 503, {}));
  }
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
  const uploadId = crypto.randomBytes(10).toString("hex");
  uploadStatusMap.set(uploadId, { status: "uploading", uploadStream: null });

  //* upload in cloud
  const uploadVideoPromise = uploadInCloudinary(video);
  const uploadThumbnailPromise = uploadInCloudinary(thumbnail);

  //* video error handle

  const [videoRes, thumbnailRes] = await Promise.all([
    uploadVideoPromise,
    uploadThumbnailPromise,
  ]).finally(() => {
    uploadStatusMap.delete(uploadId);
  });

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

  if (tokens.length < 20) tokens.push(crypto.randomBytes(10).toString("hex"));

  //* check if document is created
  if (!data) throw new ApiError(404, "video not found");

  return res
    .status(200)
    .json(new ApiResponse("succesfully uploaded", 201, data));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!videoId) throw new ApiError(404, "video id not found or invalid");

  const user = req.user;

  const videoData = await Video.findById(videoId);

  if (user?._id !== videoData?.owner.toString()) {
    throw new ApiError(401, "not the owner");
  }
  const [videoResult, thumbnailResult] = await Promise.all([
    await deleteImage(videoData?.videoPublicId, "video"),
    await deleteImage(videoData?.thumbnailPublicId, "image"),
  ]);

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
        isPublished: 1,
        createdAt: 1,
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

  return res
    .status(200)
    .json(new ApiResponse("videos fetched successfully", 200, data[0]));
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
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "videoOwner",
      },
    },
    {
      $unwind: "$videoOwner",
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "videoOwner._id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $addFields: {
        totalSubscribers: {
          $size: "$subscribers",
        },
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
        isSubscribed: {
          $cond: {
            if: { $in: [req?.user?._id || "", "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
        isLiked: {
          $cond: {
            if: { $in: [req?.user?._id || "", "$videoLikes.likedBy"] },
            then: true,
            else: false,
          },
        },
        owner: {
          username: "$videoOwner.username",
          avatar: "$videoOwner.avatar",
          _id: "$videoOwner._id",
        },
        totalSubscribers: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        updatedAt: 1,
        videoFile: 1,
        views: 1,
        videoPublicId: 1,
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
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;

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
        views: 1,
        user: {
          username: "$owner.username",
          avatar: "$owner.avatar",
          id: "$owner._id",
        },
      },
    },
    {
      $facet: {
        videos: [{ $skip: skip }, { $limit: limit }],
        total: [{ $count: "total" }],
      },
    },
  ]);
  const { videos, total } = data[0];

  return res
    .status(200)
    .json(new ApiResponse("success", 200, { videos, total: total[0] }));
});

export const searchVideo = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q)
    return res.status(404).json(new ApiResponse("invalid query", 404, {}));

  const sort = req.query.sortBy || "title";
  const sortField = {};
  sortField[sort] = 1;
  const type = req.query.type || "videos";
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const regex = new RegExp(q, "i");

  let data = null;
  let match = null;
  let project = null;
  let lookup = {
    $lookup: {
      from: "users",
      localField: "owner",
      foreignField: "_id",
      as: "user",
    },
  };
  let facet = {
    $facet: {
      search: [
        { $sort: sortField },
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
  };

  switch (type) {
    case "videos":
      match = {
        $match: {
          title: regex,
        },
      };
      project = {
        $project: {
          _id: 1,
          duration: 1,
          title: 1,
          videoFile: 1,
          thumbnail: 1,
          isPublished: 1,
          createdAt: 1,
          views: 1,
          type: 1,
          createdAt: 1,
          updatedAT: 1,
          user: {
            id: "$user._id",
            username: "$user.username",
            avatar: "$user.avatar",
          },
        },
      };
      data = await Video.aggregate([
        match,
        lookup,
        { $unwind: "$user" },
        { $addFields: { type: "videos" } },
        project,
        facet,
      ]);
      break;
    case "playlist":
      match = { $match: { name: q, isPublic: true } };
      project = {
        $project: {
          type: 1,
          name: 1,
          createdAt: 1,
          updatedAT: 1,
          videosCount: 1,
          playlistVideos: {
            $cond: {
              if: { $isArray: "$playlistVideos" },
              then: {
                thumbnail: { $arrayElemAt: ["$playlistVideos.thumbnail", 0] },
                _id: { $arrayElemAt: ["$playlistVideos._id", 0] },
              },
              else: "$playlistVideos",
            },
          },
          user: {
            id: "$user._id",
            username: "$user.username",
            avatar: "$user.avatar",
          },
        },
      };
      data = await Playlist.aggregate([
        match,
        lookup,
        {
          $lookup: {
            from: "videos",
            localField: "videos",
            foreignField: "_id",
            as: "playlistVideos",
          },
        },
        {
          $addFields: {
            type: "playlist",
            videosCount: {
              $size: "$playlistVideos",
            },
          },
        },
        { $unwind: "$user" },
        project,
        facet,
      ]);
      break;
    case "channel":
      match = { $match: { username: q } };
      lookup = {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      };
      project = {
        $project: {
          username: 1,
          avatar: 1,
          type: 1,
          createdAt: 1,
          updatedAT: 1,
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      };
      data = await User.aggregate([
        match,
        lookup,
        {
          $addFields: {
            type: "user",
            subcribersCount: {
              $size: "$subscribers",
            },
          },
        },
        project,
        facet,
      ]);
      break;
    default:
      match = {
        $match: {
          title: regex,
        },
      };
      project = {
        $project: {
          _id: 1,
          duration: 1,
          title: 1,
          videoFile: 1,
          thumbnail: 1,
          isPublished: 1,
          createdAt: 1,
          views: 1,
          type: 1,
          createdAt: 1,
          updatedAT: 1,
          user: {
            id: "$user._id",
            username: "$user.username",
            avatar: "$user.avatar",
          },
        },
      };
      data = await Video.aggregate([
        match,
        lookup,
        { $unwind: "$user" },
        { $addFields: { type: "videos" } },
        project,
        facet,
      ]);
      break;
  }

  const { search, totalCount } = data[0];
  return res
    .status(200)
    .json(
      new ApiResponse("success", 200, { search, totalCount: totalCount[0] })
    );
});

// currennt user videos
export const getCurrentUserVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req?.query?.page, 10) || 1;
  const limit = parseInt(req?.query?.limit, 10) || 10;
  const { createdAt } = req.query;
  const skip = +(page - 1) * 10;
  const { _id } = req?.user;

  const data = await Video.aggregate([
    {
      $match: {
        owner: new ObjectId(_id),
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
      $unwind: "$owner",
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        duration: 1,
        description: 1,
        views: 1,
        createdAt: 1,
        title: 1,
        user: {
          avatar: "$owner.avatar",
          username: "$owner.username",
          _id: "$owner._id",
        },
      },
    },
    {
      $sort: { title: 1 },
    },
    {
      $facet: {
        videos: [{ $limit: limit }, { $skip: skip }],
        count: [{ $count: "count" }],
      },
    },
  ]);

  const { videos, count } = data[0];

  return res.status(200).json(
    new ApiResponse("success", 200, {
      videos,
      count: count[0],
    })
  );
});
