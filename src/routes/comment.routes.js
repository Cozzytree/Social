import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  addComment,
  addTweetComment,
  deleteComment,
  getTweetComments,
  getVideoComments,
  updateComment,
  updateTweetComment,
} from "../controllers/commmnt.controller.js";
const router = Router();

//* Video comments
router.route("/v/:videoId").get(getVideoComments);
router.route("/ac/:videoId").post(verifyJwt, addComment);
router.route("/uc/:commentId").patch(verifyJwt, updateComment);
router.route("/dc/:commentId").delete(verifyJwt, deleteComment);

//* Tweet comments
router.route("/tc/:tweetId").get(getTweetComments);
router.route("/atc/:tweetId").post(verifyJwt, addTweetComment);
router.route("/dtc/:commentId").delete(verifyJwt, deleteComment);
router.route("/utc/:commentId").patch(verifyJwt, updateTweetComment);

export default router;
