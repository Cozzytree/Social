import { Router } from "express";
import {
  loginUser,
  logoutUser,
  registerUser,
  refreshAccessToken,
  changeCurrentPassword,
  updateAccountDetails,
  getUserChannelProfile,
  getWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/updatepassword").post(verifyJwt, changeCurrentPassword);

router.route("/update_userdetails").post(verifyJwt, updateAccountDetails);

router.route("/:username").get(verifyJwt, getUserChannelProfile);

router.route("/watch_history").get(verifyJwt, getWatchHistory);

//* Secured routes
router.route("/logout").post(verifyJwt, logoutUser);

router.route("/refreshToken").post(refreshAccessToken);

export default router;
