import { Tweet } from "../models/tweet.model.js";
import ApiError from "../utils/apiError.js";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

//* Add tweet
export const postTweet = asyncHandler(async (req, res) => {
  const { _id } = req?.user;
  if (!_id) throw new ApiError(401, "unknown user");

  const { content } = req.body;
  if (!content) throw new ApiError(401, "write something");

  const data = await Tweet.create([{ content, owner: _id }]);

  if (!data) throw new ApiError(401, "db error while uploading");
  return res
    .status(200)
    .json(new ApiResponse("sussecfully twetted", 200, data));
});

//*DELETE TWEET
export const deleteTweet = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const Deltweet = await Tweet.findOneAndDelete({ _id: id });
  if (!Deltweet) throw new ApiError(401, "Wasn't able to delete");

  return res.status(200).json("Successfullt deleted", 200, {});
});

//*Edit Tweet
export const editTweet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const newContent = await Tweet.findByIdAndUpdate(
    id,
    { $set: { content } },
    { new: true }
  );
  if (!newContent) throw new ApiError(401, "error while uploading");

  return res
    .success(200)
    .json(new ApiResponse("successfully updated", 200, newContent));
});

//* Get all tweets
export const getAllTweet = asyncHandler(async (req, res) => {
  await Tweet.find();
  const alltweet = await Tweet.aggregate([
    {
      $match: {},
    },
    {},
  ]);
});
