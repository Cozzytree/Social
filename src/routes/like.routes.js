import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  getLikedVideos,
  toggleTweetLike,
  toggleVideoLike,
} from "../controllers/like.controller.js";

const router = Router();

router.route("/vl/:videoId").post(verifyJwt, toggleVideoLike);
router.route("/tl/:tweetId").post(verifyJwt, toggleTweetLike);
router.route("/liked_Videos").get(verifyJwt, getLikedVideos);

export default router;
