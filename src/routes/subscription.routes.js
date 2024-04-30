import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { subscribedTo, updateSubscribe } from "../controllers/subscription.controller.js";

const router = Router();

router.route("/:channelId").patch(verifyJwt, updateSubscribe);
router.route("/subbedTo").get(verifyJwt, subscribedTo);

export default router;
