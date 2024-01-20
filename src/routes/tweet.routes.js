import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  deleteTweet,
  editTweet,
  getAllTweet,
  postTweet,
} from "../controllers/tweet.controller.js";

const router = Router();

router.route("/addTweet").post(verifyJwt, postTweet);
router.route("/d/:tweetId").delete(verifyJwt, deleteTweet);
router.route("/et/:tweetId").patch(verifyJwt, editTweet);
router.route("/at").get(verifyJwt, getAllTweet);

export default router;
