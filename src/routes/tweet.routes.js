import { Router } from "express";
import { mildJwt, verifyJwt } from "../middleware/auth.middleware.js";
import {
  deleteTweet,
  editTweet,
  getAllTweet,
  getUserTweet,
  postTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.route("/addTweet").post(verifyJwt, postTweet);
router.route("/d/:tweetId").delete(verifyJwt, deleteTweet);
router.route("/et/:tweetId").patch(verifyJwt, editTweet);
router.route("/at").get(mildJwt, getAllTweet);
router.route("/:userId").get(mildJwt, getUserTweet);

export default router;
