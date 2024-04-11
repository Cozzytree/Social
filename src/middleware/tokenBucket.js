import crypto from "crypto";
import ApiResponse from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

let isTokenBeingGenerated = false;

export const tokens = Array.from({ length: 20 }, () => {
  return crypto.randomBytes(10).toString("hex");
});

export const checkTokenExists = asyncHandler(async (req, res, next) => {
  if (tokens.length === 0) {
    return res.status(503).json(new ApiResponse("server busy", 503, {}));
  } else {
    if (!isTokenBeingGenerated) {
      isTokenBeingGenerated = true;
      const newToken = tokens.pop();
      isTokenBeingGenerated = false;
      req.token = newToken;
      return next();
    } else {
      return res.status(503).json(new ApiResponse("Server busy", 503, {}));
    }
  }
});
