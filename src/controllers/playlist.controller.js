import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { Playlist } from "../models/playlist.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ObjectId } from "mongodb";

//create a playlist
export const initializePlaylist = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");
  const { description, name, isPublic, videoId } = req.body;

  if (!name) throw new ApiError(401, "name is required");

  const data = await Playlist.create({
    owner: _id,
    description,
    name,
    isPublic,
    videos: [],
  });

  if (!data) throw new ApiError(501, "error while creating playlist");

  if (videoId) {
    await Playlist.findByIdAndUpdate(data?._id, {
      videos: { $addToSet: { videos: videoId } },
    });
  }

  return res
    .status(200)
    .json(new ApiResponse("playlist successfully created", 200, data));
});

// get details for a playlist
export const getPlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;

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
              views: 1,
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
        isPublic: 1,
        createdBy: {
          username: "$user.username",
          _id: "$user._id",
          avatar: "$ownerDetails.avatar",
        },
        playlistV: {
          views: "$playlistV.views",
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

  // Validate ObjectIds
  if (
    !mongoose.Types.ObjectId.isValid(_id) ||
    !mongoose.Types.ObjectId.isValid(videoId) ||
    !mongoose.Types.ObjectId.isValid(playlistId)
  ) {
    throw new ApiError(400, "Invalid ObjectId");
  }

  if (!_id) throw new ApiError(401, "Unauthorized request");
  if (!videoId) throw new ApiError(400, "videoId is required");
  if (!playlistId) throw new ApiError(400, "playlistId is required");

  const data = await Playlist.findByIdAndUpdate(
    playlistId,
    {
      $addToSet: { videos: videoId },
    },
    { new: true }
  );
  if (!data) throw new ApiError(404, "No document found");

  return res
    .status(200)
    .json(new ApiResponse(`added to ${data?.name}`, 200, data));
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
    .json(new ApiResponse(`removed from ${data?.name}`, 200, {}));
});

//get user playlists with isExist for the video
export const getUserPlaylists = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { videoId } = req.params;
  const matchStage = {
    $match: {
      owner: new mongoose.Types.ObjectId(_id),
    },
  };

  const addFieldsStage = {
    $addFields: {
      exist: {
        $cond: {
          if: {
            $in: [new mongoose.Types.ObjectId(videoId) || "", "$videos"],
          },
          then: true,
          else: false,
        },
      },
    },
  };

  const projectStage = {
    $project: {
      exist: 1,
      name: 1,
      description: 1,
      owner: 1,
    },
  };

  const data = await Playlist.aggregate([
    matchStage,
    addFieldsStage,
    projectStage,
  ]);

  return res.status(200).json(new ApiResponse("your playlists", 200, data));
});

// get user playlist names only
export const getUserPlaylistNames = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const data = await Playlist.find({ owner: _id }).select(
    "-description -videos"
  );
  return res.status(200).json(new ApiResponse("success", 200, data));
});

//edit playlist name
export const editPlaylistName = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { playlistId } = req.params;
  const { name } = req.body;
  if (!playlistId) throw new ApiError(404, "id not found");
  const data = await Playlist.findById(playlistId);

  //check for owner
  if (!data.owner.equals(_id)) {
    throw new ApiError(401, "unauthorized");
  }

  if (name.length <= 3 || !name) {
    throw new ApiError(404, "invalid name or not found");
  }

  await Playlist.findByIdAndUpdate(playlistId, { name });

  return res.status(200).json(new ApiResponse("successfully updated", 200, {}));
});

//edit playlit description
export const editDescription = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { playlistId } = req.params;
  const { description } = req.body;

  if (!playlistId) throw new ApiError(404, "id not found");
  const data = await Playlist.findById(playlistId);

  //check for owner
  if (!data.owner.equals(_id)) {
    throw new ApiError(401, "unauthorized");
  }

  if (description.length <= 10 || !description) {
    throw new ApiError(404, "very short or not found");
  }

  await Playlist.findByIdAndUpdate(playlistId, { description });

  return res
    .status(200)
    .json(new ApiResponse("successsfully updated", 200, {}));
});

// toggle playlists public or private
export const toggleIsPublic = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const obtainPlaylist =
    await Playlist.findById(playlistId).select("-owner -videos");
  let data;
  if (obtainPlaylist?.isPublic) {
    data = await Playlist.findByIdAndUpdate(playlistId, { isPublic: false });
  } else {
    data = await Playlist.findByIdAndUpdate(playlistId, { isPublic: true });
  }
  return res.status(200).json(new ApiResponse("success", 200, data));
});

//get all the public playlists of the user
export const getPublicPlaylists = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { userId } = req.params;

  if (!userId) throw new ApiError(404, "userId not found");
  const match = {
    $match: {
      owner: new mongoose.Types.ObjectId(userId),
      isPublic: true,
    },
  };

  const lookUp = {
    $lookup: {
      from: "videos",
      localField: "videos",
      foreignField: "_id",
      as: "playlistVideos",
    },
  };

  const addField = {
    $addFields: {
      videosCount: {
        $size: "$playlistVideos",
      },
    },
  };

  const project = {
    $project: {
      name: 1,
      isPublic: 1,
      description: 1,
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
    },
  };

  const facetStage = {
    $facet: {
      metadata: [{ $count: "total" }],
      playListVideos: [{ $skip: skip }, { $limit: limit }],
    },
  };

  const data = await Playlist.aggregate([
    match,
    lookUp,
    addField,
    project,
    facetStage,
  ]);

  const { metadata, playListVideos } = data[0];

  return res
    .status(200)
    .json(
      new ApiResponse("success", 200, { total: metadata[0], playListVideos })
    );
});

//get current user playlist
export const currentUserPlaylists = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const { _id } = req.user;

  const data = await Playlist.aggregate([
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
        as: "playlistOwner",
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlistVideos",
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        isPublic: 1,
        thumbnail: { $arrayElemAt: ["$playlistVideos.thumbnail", 0] },
      },
    },
    {
      $facet: {
        total: [{ $count: "total" }],
        playlist: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ]);

  const { playlist, total } = data[0];

  return res.status(200).json(
    new ApiResponse("success", 200, {
      playlist,
      total: total[0],
    })
  );
});
