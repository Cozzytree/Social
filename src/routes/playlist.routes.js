import { Router } from "express";
import { verifyJwt } from "../middleware/auth.middleware.js";
import {
  addVideoToPlaylist,
  deletePlaylist,
  deleteVideofromPL,
  getPlaylist,
  getUserPlaylists,
  initializePlaylist,
} from "../controllers/playlist.controller.js";
const router = Router();

router.route("/getAplaylist/:playlistId").get(verifyJwt, getPlaylist);
router.route("/getPlaylists").get(verifyJwt, getUserPlaylists);
router.route("/createPlaylist").put(verifyJwt, initializePlaylist);
router.route("/deletePlaylist/:playlistId").delete(verifyJwt, deletePlaylist);
router
  .route("/addVideo/:playlistId/:videoId")
  .put(verifyJwt, addVideoToPlaylist);

router
  .route("/removeVideo/:playlistId/:videoId")
  .patch(verifyJwt, deleteVideofromPL);
export default router;
