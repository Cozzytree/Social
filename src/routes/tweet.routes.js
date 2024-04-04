import { Router } from "express";
import { mildJwt, verifyJwt } from "../middleware/auth.middleware.js";
import {
  deleteTweet,
  editTweet,
  getAllTweet,
  getAtweet,
  getCurrentUserTweets,
  getUserTweet,
  postTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.route("/addTweet").post(verifyJwt, postTweet);
router.route("/info/:tweetId").get(mildJwt, getAtweet);
router.route("/d/:tweetId").delete(verifyJwt, deleteTweet);
router.route("/editTweet/:tweetId").patch(verifyJwt, editTweet);
router.route("/at").get(mildJwt, getAllTweet);
router.route("/user_t/:userId").get(mildJwt, getUserTweet);
router.route("/cu/getCurrentUserTweets").get(verifyJwt, getCurrentUserTweets);

export default router;
