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
  loginWithOtp,
  verifyOtp,
  clearWHistory,
  settings,
  updateBioText,
  addLinksInBio,
  deleteLinkFromBio,
  forgotPassword,
  resetPassword,
  getCurrentUserDetails,
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
router.route("/getCurrentUserDetails").get(verifyJwt, getCurrentUserDetails);
router.route("/wh/:videoId").patch(mildJwt, updateWatchHistory);
router.route("/clearWatchHistory").patch(verifyJwt, clearWHistory);
router.route("/login/send-otp").post(loginWithOtp);
router.route("/login/verifyOtp").post(verifyOtp);

//* Secured routes
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/updatepassword").post(verifyJwt, changeCurrentPassword);
router.route("/refreshToken").post(refreshAccessToken);
router.route("/update_userdetails").patch(verifyJwt, updateAccountDetails);
router.route("/:userId").get(mildJwt, getUserChannelProfile);
router
  .route("/update_avatar")
  .patch(verifyJwt, upload.single("avatar"), updateUserAvatar);
router
  .route("/update_coverimage")
  .patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage);
router.route("/wh/watch_History").get(verifyJwt, getWatchHistory);
router.route("/ud/user_details").get(verifyJwt, settings);
router.route("/updateBioText").post(verifyJwt, updateBioText);
router.route("/addLinkToBio").post(verifyJwt, addLinksInBio);
router.route("/deleteLinkfromBio/:linkId").delete(verifyJwt, deleteLinkFromBio);
router.route("/forgot_password").post(forgotPassword);
router.route("/reset_password").post(resetPassword);

export default router;
