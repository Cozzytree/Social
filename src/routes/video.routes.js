import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { deleteVideo, uploadVideo } from "../controllers/video.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router
  .route("/upload")
  .post(verifyJwt, upload.single("videoFile"), uploadVideo);

router.route("/d/:videoId").delete(verifyJwt, deleteVideo);

export default router;
