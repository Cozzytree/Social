import { Router } from "express";
import { mildJwt, verifyJwt } from "../middleware/auth.middleware.js";
import { checkTokenExists } from "../middleware/tokenBucket.js";

import {
  deleteVideo,
  getAVideo,
  getAllVideos,
  getUserVideo,
  updateThumbnail,
  updateVideoTandD,
  updateView,
  uploadVideo,
  rocommendedVideos,
  searchVideo,
  getCurrentUserVideos,
} from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { imageProcessor } from "../middleware/imageprocessing.js";

const router = Router();

router.route("/upload").post(
  checkTokenExists,
  verifyJwt,
  upload.fields([
    { name: "videoFile", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadVideo
);

router.route("/").get(getAllVideos);
router.route("/d/:videoId").delete(verifyJwt, deleteVideo);
router.route("/e_title/:videoId").patch(verifyJwt, updateVideoTandD);
router
  .route("/e_thumbnail/:videoId")
  .patch(
    verifyJwt,
    upload.single("thumbnail"),
    imageProcessor,
    updateThumbnail
  );
router.route("/user_v/:userId").get(mildJwt, getUserVideo);
router.route("/:videoId").get(mildJwt, getAVideo);
router.route("/addView/:videoId").patch(updateView);
router.route("/recommends/:videoId").get(rocommendedVideos);
router.route("/s/query").get(mildJwt, searchVideo);
router.route("/cu/currentUserVideos").get(verifyJwt, getCurrentUserVideos);

export default router;
