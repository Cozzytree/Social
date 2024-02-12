import ApiError from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
dotenv.config();

export const verifyJwt = asyncHandler(async (req, _, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) throw new ApiError(401, "unauthorized request");

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    // const user = await User.findById(decodedToken?._id).select(
    //   "-password -refreshToken"
    // );
    // if (!user) {
    //   throw new ApiError(401, "invalid access token");
    // }

    req.user = decodedToken;
    next();
  } catch (error) {
    throw new ApiError(401, error.message || "invalid acces token");
  }
});

export const mildJwt = asyncHandler(async (req, _, next) => {
  try {
    let decodedToken;
    let user = "";

    if (req.cookies?.accessToken) {
      const token = req.cookies.accessToken;

      decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

      if (decodedToken) {
        user = await User.findById(decodedToken._id).select(
          "-password -refreshToken"
        );
      }
    } else {
      user = "";
    }
    req.user = user;
    next();
  } catch (error) {
    console.log(error);
    throw new ApiError(401, error.message || "invalid access token");
  }
});
