import { Router } from "express";
import { mildJwt, verifyJwt } from "../middleware/auth.middleware.js";
import {
  addComment,
  addTweetComment,
  deleteComment,
  deleteReply,
  getReplies,
  getTweetComments,
  getVideoComments,
  replyComment,
  updateComment,
  updateReply,
  updateTweetComment,
} from "../controllers/commmnt.controller.js";
const router = Router();

//* Video comments
router.route("/v/:videoId").get(mildJwt, getVideoComments);
router.route("/ac/:videoId").post(verifyJwt, addComment);
router.route("/uc/:commentId").patch(verifyJwt, updateComment);

// delete comment 
router.route("/dc/:commentId").delete(verifyJwt, deleteComment);

//* Tweet comments
router.route("/tc/:tweetId").get(mildJwt, getTweetComments);
router.route("/atc/:tweetId").post(verifyJwt, addTweetComment);
router.route("/utc/:commentId").patch(verifyJwt, updateTweetComment);

// reply
router.route("/replyComment/:commentId").post(verifyJwt, replyComment);
router.route("/getReplies/:commentId").get(mildJwt, getReplies);
router.route("/updateReplies/:replyId").patch(verifyJwt, updateReply);
router.route("/deletereply/:replyId").delete(verifyJwt, deleteReply);
export default router;
