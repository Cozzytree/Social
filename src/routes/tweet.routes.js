import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import { postTweet } from "../controllers/tweet.middleware.js";

const router = Router();

router.route("/addTweet").post(verifyJwt, postTweet);

export default router;
