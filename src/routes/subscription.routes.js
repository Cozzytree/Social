import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { updateSubscribe } from "../controllers/subscription.controller.js";
const router = Router();

router.route("/:channelId").patch(verifyJwt, updateSubscribe);

export default router;
