import ApiError from "../utils/apiError.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
dotenv.config();

export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    let token = null;
    if (req.cookies?.accessToken) {
      token =
        req.cookies?.accessToken ||
        req.header("Authorization")?.replace("Bearer ", "");
    } else if (req.cookies?.refreshToken) {
      token = req.cookies?.refreshToken;
    }

    if (!token) throw new ApiError(401, "unauthorized request");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.user = decodedToken;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || "invalid access token");
  }
});

export const mildJwt = asyncHandler(async (req, _, next) => {
  try {
    let decodedToken;
    let user = null;

    if (req.cookies?.accessToken) {
      const token = req.cookies.accessToken;

      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if (decodedToken) {
        user = await User.findById(decodedToken._id).select(
          "-password -refreshToken"
        );
      }
    }
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || "invalid access token");
  }
});
