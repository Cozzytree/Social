import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import { deleteImage } from "../utils/cloudinaryDelete.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";

const sendEmail = async (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "hootowldhrubo@gmail.com",
      pass: process.env.APP_CODE,
    },
  });

  const mailOptions = {
    from: "hootowldhrubo@gmail.com",
    to,
    subject,
    text,
  };

  const info = await transporter.sendMail(mailOptions);
  console.log("Email sent: " + info.response);
};

async function generate_AccessAnd_RefreshToken(id) {
  try {
    const user = await User.findById(id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(501, "something went wrong while generating tokens");
  }
}

//*..........................Register User ........................
export const registerUser = asyncHandler(async (req, res) => {
  // get data from user
  const { username, email, password, fullName } = req.body;
  if ([username, email, fullName].some((fields) => fields?.trim() === "")) {
    throw new ApiError(401, "All fields are required");
  }

  //*check for existing user
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(401, "Username or email already exists");
  }

  //* check avatar Image
  let coverImagePath;
  let avatarPath;
  if (
    req.files?.coverImage &&
    Array.isArray(req.files?.coverImage) &&
    req.files?.coverImage.length > 0
  ) {
    coverImagePath = req.files.coverImage[0].path;
  }

  if (
    req.files?.avatar &&
    Array.isArray(req.files?.avatar) &&
    req.files?.avatar.length > 0
  ) {
    avatarPath = req.files.avatar[0].path;
  }

  if (!avatarPath) {
    throw new ApiError(401, "Avatar is required");
  }

  //*upload image
  const avatar = await uploadInCloudinary(avatarPath);
  const coverImage = await uploadInCloudinary(coverImagePath);
  if (!avatar) {
    throw new ApiError(501, "error while uploading");
  }

  //*create userObject
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar?.secure_url,
    coverImage: coverImage?.secure_url || "",
    avatarPublicId: avatar?.public_id,
    coverImagePublicId: coverImage?.public_id || "",
  });

  //* removing password and refreshToken from sending response.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(501, "Something went wrong while creating user");

  return res
    .status(200)
    .json(new ApiResponse("user successfully registered", 200, createdUser));
});

//*..........................login user ........................
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  //* Check if email or username is recieved
  if (!email && !username) {
    throw new ApiError(401, "Username or email is required");
  }

  //* Find the user in the database
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User dosent exist");
  }

  //* Check id the password match
  const checkIfCorrect = await user.checkPassword(password);
  if (!checkIfCorrect) {
    throw new ApiError(401, "Incorrect password");
  }

  //* Generate Access and refreshToken
  const { accessToken, refreshToken } = await generate_AccessAnd_RefreshToken(
    user._id
  );

  //* Modifying the object that needs to be sent as a response
  const userObject = await User.findById(user._id).select(
    "-password -accessToken"
  );

  //* Response
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    domain: "localhost",
    path: "/",
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse("logged in Successfully", 200, {
        user: userObject,
        accessToken,
        refreshToken,
      })
    );
});

//*......................... log out user........................
export const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user?._id,
    { $set: { refreshToken: undefined } },
    { new: true }
  );
  const options = { httpOnly: true, secure: true };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse("user logged out", 200, {}));
});

//*..........................refresh Token ........................
export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingRefToken) throw new ApiError(401, "unauthorized request");

  try {
    const verifiedToken = jwt.verify(
      incomingRefToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    if (!verifiedToken) throw new ApiError(402, "unauthorized token");

    const getVerifiesUser = await User.findById(verifiedToken?._id).select(
      "-password"
    );

    if (!getVerifiesUser) throw new ApiError(401, "Invalid user token");

    if (incomingRefToken !== getVerifiesUser?.refreshToken) {
      throw new ApiError(401, "Expired refresh token");
    }

    const { accessToken, newrefreshToken } =
      await generate_AccessAnd_RefreshToken(getVerifiesUser._id);

    const options = { httpOnly: true, secure: true };

    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newrefreshToken, options)
      .json(
        new ApiResponse("successfully refreshed token", 200, {
          accessToken,
          refreshToken: newrefreshToken,
        })
      );
  } catch (error) {
    throw new ApiError(401, error.message || "invalid refresh Token");
  }
});

//*.........................Change Password ...........................
export const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req?.user._id);

  const checkOldPassword = await user.checkPassword(oldPassword);

  if (!checkOldPassword) {
    throw new ApiError(401, "invalid old password password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse("password updated successfully", 200, {}));
});

//*.........................get Current user ...........................
export const getCurrentUser = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "unauthorized request");

  return res
    .status(200)
    .json(new ApiResponse("current user fetched succesfully", 200, req.user));
});

//*.........................update account details ...........................
export const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError(401, "required eamil or password to update");
  }
  let user;
  // let user = await User.findById(req?.user._id).select("-password");
  // if (!user) throw new ApiError(401, "unauthorized update request");

  if (fullName && email) {
    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
          email,
        },
      },
      { new: true }
    ).select("-password");
  }

  if (email && !fullName) {
    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          email,
        },
      },
      { new: true }
    ).select("-password");
  }

  if (fullName && !email) {
    user = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName,
        },
      },
      { new: true }
    ).select("-password");
  }

  if (!user) throw new ApiError(401, "unauthorized request");

  return res
    .status(200)
    .json(new ApiResponse("user succesfully Updated", 200, user));
});

//*.........................update Avatar...........................
export const updateUserAvatar = asyncHandler(async (req, res) => {
  // const user = req.user;
  const newAvatarlocalPath = req.file?.path;

  const oldImageToDelete = req?.user.avatar.avatarPublicId;

  if (!newAvatarlocalPath)
    throw new ApiError(400, "avatar image file is missing");

  const avatar = await uploadInCloudinary(newAvatarlocalPath);

  if (!avatar) return new ApiError(501, "error while uploading");

  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        avatar,
      },
    },
    { new: true }
  ).select("-password");

  await deleteImage(oldImageToDelete);

  // if (!user) throw new ApiError(4001, "unauthorized request");
  return res
    .status(200)
    .json(new ApiResponse("avatar successfully updated", 200, user));
});

//*.........................update cover IMage ...........................
export const updateUserCoverImage = asyncHandler(async (req, res) => {
  // const user = req.user;
  const coverImageLocal = req.file?.path;
  const { coverImagePublicId } = req?.user;

  if (!coverImageLocal) throw new ApiError(400, "cover image is missing");

  const coverImage = await uploadInCloudinary(coverImageLocal);

  if (!coverImage) return new ApiError(501, "error while uploading");

  const user = await User.findByIdAndUpdate(
    req?.user._id,
    {
      $set: {
        coverImage,
      },
    },
    { new: true }
  ).select("-password");

  await deleteImage(coverImagePublicId);
  return res
    .status(200)
    .json(new ApiResponse("coverImage successfully updated", 200, user));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { userId } = req?.params;
  const channel = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribeTo",
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        subcribersCount: {
          $size: "$subscribers",
        },
        channelSubscribedTo: {
          $size: "$subscribeTo",
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
        totalVideos: 1,
        avatar: 1,
        coverImage: 1,
        subcribersCount: 1,
        channelSubscribedTo: 1,
      },
    },
  ]);

  if (!channel) throw new ApiError(402, "channel dosen't exist");

  return res
    .status(200)
    .json(new ApiResponse("User obtained succesfully", 200, channel[0]));
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const { _id } = req.user;

  const wh = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(_id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watch_history",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owners",
              pipeline: [
                {
                  $project: {
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owners: {
                $first: "$owners",
              },
            },
          },
        ],
      },
    },
    { $unwind: "$watch_history" },
    {
      $project: {
        watch_history: 1,
        owners: 1,
      },
    },
  ]);

  if (!wh) {
    throw new ApiError(401, "couldn't get history");
  }

  return res
    .status(200)
    .json(new ApiResponse("here is you watch history", 200, wh));
});

export const updateWatchHistory = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { videoId } = req.params;
  if (!_id) return res.status(200);

  await User.findByIdAndUpdate(_id, {
    $addToSet: {
      watchHistory: videoId,
    },
  });

  return res.status(200);
});

export const loginWithOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;

  function generateOTP() {
    const random = Math.floor(Math.random() * 1000000);
    const otp = String(random).padStart(6, "0");
    return +otp;
  }

  const otp = generateOTP();

  const user = await User.findOneAndUpdate(
    { email },
    { otp: { code: otp, createdAt: new Date() } },
    { upsert: true, new: true }
  );

  sendEmail(email, "OTP Verification", `Your OTP is: ${otp}`);

  setTimeout(
    async () => {
      await User.findOneAndUpdate({ email }, { otp: null });
      console.log("OTP expired for user:", email);
    },
    10 * 60 * 1000
  );

  res.status(200).json(new ApiResponse("OTP sent successfully", 200, {}));
});

export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ email });

  if (!user || !user.otp) {
    throw new ApiError(404, "User or OTP not found");
  }

  const storedOtp = user.otp;
  if (
    otp !== storedOtp.code ||
    Date.now() - storedOtp.createdAt.getTime() > 10 * 60 * 1000
  ) {
    throw new ApiError(401, "Invalid OTP or OTP expired");
  }

  await User.findOneAndUpdate({ email }, { otp: null });

  res.status(200).json({ message: "Logged in successfully", user: user });
});
