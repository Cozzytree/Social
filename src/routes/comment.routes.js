import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { getVideoComments } from "../controllers/commmnt.controller.js";
const router = Router();

router.route("/:videoId", getVideoComments);

export default router;
