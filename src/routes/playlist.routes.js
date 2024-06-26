import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  addVideoToPlaylist,
  currentUserPlaylists,
  deletePlaylist,
  deleteVideofromPL,
  editDescription,
  editPlaylistName,
  getPlaylist,
  getPublicPlaylists,
  getUserPlaylistNames,
  getUserPlaylists,
  initializePlaylist,
  toggleIsPublic,
} from "../controllers/playlist.controller.js";

const router = Router();

router.route("/getAplaylist/:playlistId").get(verifyJwt, getPlaylist);
router.route("/cu/currentUserPlaylists").get(verifyJwt, currentUserPlaylists);
router.route("/getPlaylists/:videoId/:userId").get(verifyJwt, getUserPlaylists);
router.route("/getPlaylistNames").get(verifyJwt, getUserPlaylistNames);
router.route("/createPlaylist").put(verifyJwt, initializePlaylist);
router.route("/deletePlaylist/:playlistId").delete(verifyJwt, deletePlaylist);
router
  .route("/addVideo/:playlistId/:videoId")
  .patch(verifyJwt, addVideoToPlaylist);

router
  .route("/removeVideo/:playlistId/:videoId")
  .patch(verifyJwt, deleteVideofromPL);

router
  .route("/editPlaylistName/:playlistId")
  .patch(verifyJwt, editPlaylistName);

router.route("/editDescription/:playlistId").patch(verifyJwt, editDescription);
router.route("/togglePublic/:playlistId").patch(verifyJwt, toggleIsPublic);
router.route("/publicPlaylist/:userId").get(getPublicPlaylists);

export default router;
