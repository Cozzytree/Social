import { Router } from "express";
import {
  addLinksInBio,
  changeCurrentPassword,
  clearWHistory,
  confirm_update_password,
  deleteLinkFromBio,
  forgotPassword,
  getCurrentUser,
  getCurrentUserDetails,
  getUserChannelProfile,
  getWatchHistory,
  loginUser,
  loginWithOtp,
  logoutUser,
  refreshAccessToken,
  registerUser,
  resetPassword,
  settings,
  updateAccountDetails,
  updateBioText,
  updateUserAvatar,
  updateUserCoverImage,
  updateWatchHistory,
  verifyOtp,
  verifyUser,
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
router.route("/verifyUser/:token").patch(verifyUser);
router.route("/login").post(loginUser);
router.route("/getcurrentUser").get(verifyJwt, getCurrentUser);
router.route("/getCurrentUserDetails").get(verifyJwt, getCurrentUserDetails);
router.route("/wh/:videoId").patch(mildJwt, updateWatchHistory);
router.route("/clearWatchHistory").patch(verifyJwt, clearWHistory);

// login with otp
router.route("/login/send-otp").post(loginWithOtp);
router.route("/login/verifyOtp").post(verifyOtp);

//* Secured routes
router.route("/logout").post(verifyJwt, logoutUser);

//change password
router.route("/updatepassword").post(verifyJwt, changeCurrentPassword);
router.route("/confirm_update_password/:token/:userId/:newPass").post(confirm_update_password);

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

// forgot password
router.route("/forgot_password").post(forgotPassword);
router.route("/reset_password").post(resetPassword);

export default router;
