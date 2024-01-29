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
  if (!ifAlreadySub) {
    data = await Subscription.create({
      subscriber: _id,
      channelId: channelId,
    });
  }
  console.log(data);
  if (!data) throw new ApiError(501, "server error");

  return res.status(200).json(new ApiResponse("success", 200, data));
});
