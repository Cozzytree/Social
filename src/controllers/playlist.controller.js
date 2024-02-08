import mongoose from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginUser } from "./user.controller.js";

export const initializePlaylist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");
  const { description, name } = req.body;

  if (!name) throw new ApiError(401, "name is required");

  const data = await Playlist.create({
    owner: _id,
    description,
    name,
    videos: [],
  });

  if (!data) throw new ApiError(501, "error while creating playlist");

  return res
    .status(200)
    .json(new ApiResponse("playlist successfully created", 200, data));
});

export const getPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

  // [
  //   {
  //     $match: {
  //       _id: ObjectId("65bfcbc0f7dda7612c5514e0"),
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "users",
  //       localField: "owner",
  //       foreignField: "_id",
  //       as: "user",
  //     },
  //   },
  //   {
  //     $lookup: {
  //       from: "videos",
  //       localField: "videos",
  //       foreignField: "_id",
  //       as: "playlistV",
  //     },
  //   },
  //   {
  //     $unwind: {
  //       path: "$user",
  //       preserveNullAndEmptyArrays: true,
  //     },
  //   },
  //   {
  //     $project: {
  //       name: 1,
  //       description: 1,
  //       createdBy: {
  //         username: "$user.username",
  //         _id: "$user._id",
  //       },
  //       playlistV: {
  //         videosFile: "$playlistV.videoFile",
  //         thumbnail: "$playlistV.thumbnail",
  //         duration: "$playlistV.duration",
  //         _id: "$playlistV._id",
  //         title: "$playlistV.title",
  //       },
  //     },
  //   },
  // ];

  const data = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
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
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistV",
        pipeline: [
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
            },
          },
          {
            $project: {
              duration: 1,
              title: 1,
              videoFile: 1,
              thumbnail: 1,
              _id: 1,
              owner: 1,
            },
          },
        ],
      },
    },

    {
      $unwind: {
        path: "$user",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $unwind: {
        path: "$playlistV",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "playlistV.owner._id",
        foreignField: "_id",
        as: "ownerDetails",
      },
    },
    {
      $unwind: {
        path: "$ownerDetails",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdBy: {
          username: "$user.username",
          _id: "$user._id",
          avatar: "$ownerDetails.avatar",
        },
        playlistV: {
          videosFile: "$playlistV.videoFile",
          thumbnail: "$playlistV.thumbnail",
          duration: "$playlistV.duration",
          _id: "$playlistV._id",
          title: "$playlistV.title",
          user: {
            username: "$playlistV.owner.username",
            avatar: "$playlistV.owner.avatar",
            id: "$playlistV.owner._id",
          },
        },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse("success", 200, data));
});

export const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { videoId, playlistId } = req.params;
  if (!_id) throw new ApiError(401, "unauthorized request");
  if (!videoId) throw new ApiError(401, "videoId is required");
  if (!playlistId) throw new ApiError(401, "playlistId is required");

  const data = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    { $new: true }
  );
  if (!data) throw new ApiError(404, "no document found");

  return res
    .status(200)
    .json(new ApiResponse("video successfully added to playlist", 200, data));
});

export const deletePlaylist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");

  const { playlistId } = req.params;
  if (!playlistId) throw new ApiError(401, "invalid request");

  const data = await Playlist.findByIdAndDelete(playlistId);
  if (!data) throw new ApiError(501, "error while deleting playlist");

  return res
    .status(200)
    .json(new ApiResponse("playlist successfully deleted", 200, {}));
});

export const deleteVideofromPL = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");
  const { playlistId, videoId } = req.params;

  const data = await Playlist.findByIdAndUpdate(
    playlistId,
    { $pull: { videos: videoId } },
    { new: true }
  );
  if (!data)
    throw new ApiError(501, "error while removing video from playlist");

  return res
    .status(200)
    .json(
      new ApiResponse("video successfully removed from the playlist", 200, {})
    );
});

export const getUserPlaylists = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const data = await Playlist.find({ owner: _id });

  return res.status(200).json(new ApiResponse("your playlists", 200, data));
});
