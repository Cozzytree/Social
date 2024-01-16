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
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");

  const { tweetId } = req.params;
  if (!tweetId) throw new ApiError(401, "invalid id");

  const Deltweet = await Tweet.findOneAndDelete({ _id: tweetId });
  if (!Deltweet) throw new ApiError(501, "error  while deleting");

  return res.status(200).json(new ApiResponse("Successfully deleted", 200, {}));
});

//*Edit Tweet
export const editTweet = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  if (!_id) throw new ApiError(401, "unauthorized request");

  const { tweetId } = req.params;
  const { content } = req.body;

  const newContent = await Tweet.findByIdAndUpdate(
    tweetId,
    { $set: { content } },
    { new: true }
  );
  if (!newContent) throw new ApiError(401, "error while uploading");

  return res
    .status(200)
    .json(new ApiResponse("successfully updated", 200, newContent));
});

//* Get all tweets
export const getAllTweet = asyncHandler(async (req, res) => {
  const allTweets = await Tweet.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "ownerInfo",
      },
    },
    {
      $unwind: "$ownerInfo",
    },
    {
      $project: {
        content: 1,
        ownerInfo: {
          _id: 1,
          username: 1,
        },
      },
    },
  ]);

  if (!allTweets) throw new ApiError(501, "was't able to get tweets");

  return res
    .status(200)
    .json(new ApiResponse("here you have it", 200, allTweets));
});
