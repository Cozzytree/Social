import { Router } from "express";
import { mildJwt, verifyJwt } from "../middleware/auth.middleware.js";
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
} from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/upload").post(
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
  .patch(verifyJwt, upload.single("thumbnail"), updateThumbnail);
router.route("/user_v/:userId").get(mildJwt, getUserVideo);
router.route("/:videoId").get(mildJwt, getAVideo);
router.route("/addView/:videoId").patch(updateView);
router.route("/recommends/:videoId").get(rocommendedVideos);
router.route("/s/query").get(searchVideo);

export default router;
