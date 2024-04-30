import mongoose from "mongoose";
import { Subscription } from "../models/subscribtions.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const updateSubscribe = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  const { _id } = req.user;
  let data;
  const ifAlreadySub = await Subscription.find({
    subscriber: _id,
    channel: channelId,
  });

  if (ifAlreadySub) {
    data = await Subscription.findOneAndDelete({
      subscriber: _id,
      channel: channelId,
    });
  }
  if (ifAlreadySub.length === 0) {
    data = await Subscription.create({
      subscriber: _id,
      channel: channelId,
    });
  }
  if (!data) throw new ApiError(404, "error while storing");

  return res.status(200).json(new ApiResponse("success", 200, data));
});

export const subscribedTo = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const data = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subbedTo",
      },
    },
    {
      $project: {
        avatar: { $arrayElemAt: ["$subbedTo.avatar", 0] },
        username: { $arrayElemAt: ["$subbedTo.username", 0] },
        _id: { $arrayElemAt: ["$subbedTo._id", 0] },
      },
    },
  ]);

  return res.status(200).json(new ApiResponse("success", 200, data));
});
