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
  updateUserAvatar,
  updateUserCoverImage,
  getCurrentUser,
  updateWatchHistory,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { mildJwt, verifyJwt } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  registerUser
);

router.route("/login").post(loginUser);

router.route("/getcurrentUser").get(verifyJwt, getCurrentUser);

//* Secured routes
router.route("/logout").post(verifyJwt, logoutUser);

router.route("/updatepassword").post(verifyJwt, changeCurrentPassword);

router.route("/refreshToken").post(refreshAccessToken);

router.route("/update_userdetails").patch(verifyJwt, updateAccountDetails);

router.route("/:userId").get(verifyJwt, getUserChannelProfile);

router
  .route("/update_avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);

router
  .route("/update_coverimage")
  .patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);

router.route("/watch_history").get(verifyJwt, getWatchHistory);
router.route("/wh/:videoId").patch(mildJwt, updateWatchHistory);

export default router;
