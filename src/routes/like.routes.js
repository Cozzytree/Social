import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleReplyLikes,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.route("/vl/:videoId").post(verifyJwt, toggleVideoLike);
router.route("/tl/:tweetId").post(verifyJwt, toggleTweetLike);
router.route("/rl/:replyId").post(verifyJwt, toggleReplyLikes);
router.route("/cl/:commentId").post(verifyJwt, toggleCommentLike);
router.route("/liked_Videos").get(verifyJwt, getLikedVideos);

export default router;
