import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from "../controllers/commmnt.controller.js";
const router = Router();

router.route("/v/:videoId").get(getVideoComments);
router.route("/ac/:videoId").post(verifyJwt, addComment);
router.route("/uc/:commentId").patch(verifyJwt, updateComment);
router.route("/dc/:commentId").delete(verifyJwt, deleteComment);

export default router;
