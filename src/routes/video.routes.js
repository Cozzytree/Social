import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  updateThumbnail,
  updateTitle,
  uploadVideo,
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
router.route("/e_title/:videoId").patch(verifyJwt, updateTitle);
router
  .route("/e_thumbnail/:videoId")
  .patch(verifyJwt, upload.single("thumbnail"), updateThumbnail);

export default router;
