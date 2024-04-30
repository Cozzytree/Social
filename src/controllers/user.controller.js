import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import crypto from "crypto";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import { User } from "../models/user.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { deleteImage } from "../utils/cloudinaryDelete.js";
import { ObjectId } from "mongodb";

const sendEmail = async (to, subject, html, text) => {
  if (!to || !subject || !text) {
    throw new Error("Invalid email parameters");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: process.env.MY_EMAIL,
      pass: process.env.APP_CODE,
    },
  });

  const mailOptions = {
    from: process.env.MY_EMAIL,
    to,
    subject,
    html,
    text
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info);
    transporter.close();
  } catch (err) {
    console.error("Error sending email:", err);
    throw new Error("Unable to send email");
  }

  // const info = await transporter
  //   .sendMail(mailOptions)
  //   .then((data) => data)
  //   .catch((err) => {
  //     if (err) throw new ApiError(502, "unable to send email");
  //   });
  // transporter.close();
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

//..........................Register User ........................
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

  const generateToken = crypto.randomBytes(10).toString();
  const tokens = await User.findByIdAndUpdate(user?._id, {
    verifyToken: { token: generateToken, expiry: Date.now() + 3600000 },
  });
  if (!tokens) throw new ApiError(404, "error while generating tokens");
  await sendEmail(
    email,
    `VeriFy your email`,
    "",
    `<h1>Click the link to verify</h1>
   <a href="http://locahost:3000/verify/${generateToken}">Verify</a>`
  );
  //* removing password and refreshToken from sending response.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(501, "Something went wrong while creating user");

  return res
    .status(200)
    .json(
      new ApiResponse("user successfully registered email", 200, createdUser)
    );
});

// ............... verify user ................
export const verifyUser = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) throw new ApiError(404, "invalid token or token not found");
  const data = await User.find({
    verifyToken: {
      token: token,
      expiry: { $gt: Date.now() },
    },
  });
  if (!data.verifiedToken.token || !dara.verifiedToken.expiry)
    throw new ApiError(404, "invalid tokesn");

  data.verified = true;
  await data.save({ validateBeforeSave: false });
  return res
    .status(201)
    .json(new ApiResponse("user successfully verified", 201, {}));
});

//..........................login user ........................
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  // Check if email or username is recieved
  if (!email && !username) {
    throw new ApiError(401, "Username or email is required");
  }

  // Find the user in the database
  const user = await User.findOne({ $or: [{ email }, { username }] });
  if (!user) {
    throw new ApiError(404, "User dosent exist");
  }

  // Check id the password match
  const checkIfCorrect = await user.checkPassword(password);
  if (!checkIfCorrect) {
    throw new ApiError(401, "Incorrect password");
  }

  // Generate Access and refreshToken
  const { accessToken, refreshToken } = await generate_AccessAnd_RefreshToken(
    user._id
  );

  // Modifying the object that needs to be sent as a response
  const userObject = await User.findById(user._id).select(
    "-password -accessToken"
  );

  // Response
  const options = {
    httpOnly: true,
    secure: true,
    sameSite: "None",
    domain: "localhost",
    path: "/",
  };

  res
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
  if (oldPassword === newPassword)
    throw new ApiError(401, "new password cannot be same as old password");

  const user = await User.findById(req?.user._id);
  const checkOldPassword = await user.checkPassword(oldPassword);

  if (!checkOldPassword) {
    throw new ApiError(401, "invalid old password password");
  }
  const token = crypto.randomBytes(10).toString("hex");

  user.verifyToken = { token: token, expiry: Date.now() + 3600000 };
  await user.save({ validateBeforeSave: false });

  await sendEmail(
    user.email,
    "Change Password",
    `otp to change password ${token} will expire in 1 hour`
  );

  return res
    .status(200)
    .json(new ApiResponse("Verify email to update password", 200, {}));
});
export const confirm_update_password = asyncHandler(async (req, res) => {
  const { userId, token, newPass } = req.params;
  console.log(userId, token, newPass);
  if (!userId || !token || !newPass) throw new ApiError(404, "Token not found");
  const user = await User.findOne({
    _id: userId,
    verifyToken: { token: token, expiry: { $gt: Date.now() } },
  });

  if (!user) throw new ApiError(404, "unable to locate user");

  user.password = newPass;
  user.verifyToken.token = null; // Remove the verification token
  user.verifyToken.expiry = null;
  console.log(user);
  await user.save({ validateBeforeSave: false });

  return res.status(201).json(new ApiResponse("password updated", 201, {}));
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
  const user = await User.findById(req.user._id).select(
    "-password -email -fullName -avatar -coverImage -watchHistory -coverImagePublicId -verifyToken -resetPasswordToken -otp -resetPasswordExpires"
  );
  if (!user) throw new ApiError(404, "user not found");

  const newAvatarlocalPath = req.file?.path;
  if (!newAvatarlocalPath) throw new ApiError(404, "image file not found");

  const oldImageToDelete = user?.avatarPublicId;

  const avatar = await uploadInCloudinary(newAvatarlocalPath);
  if (!avatar) return new ApiError(501, "error while uploading");

  user.avatar = avatar?.secure_url;
  user.avatarPublicId = avatar?.public_id;
  user.save({ validateBeforeSave: false });

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
        _id: new ObjectId(userId),
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
        bio: 1,
        isSubscribed: {
          $cond: {
            if: {
              $in: [
                new ObjectId(req.user?._id || ""),
                "$subscribers.subscriber",
              ],
            },
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
        _id: new ObjectId(_id),
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

//login with opt
export const loginWithOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    throw new ApiError(404, "Invalid email or not found");
  }

  const randomOtp = crypto.randomBytes(6).toString("hex");
  const user = await User.findOneAndUpdate(
    { email },
    { loginotp: { token: randomOtp, expiry: Date.now() + 3600000 } },
    { upsert: true, new: true }
  );
  if (!user) throw new ApiError(404, "email not found");

 await sendEmail(
    email,
    "Login",
    `<a href="http://localhost:3000/login/login_verify/${user?._id}_${randomOtp}">Login</a>`,
     "Click to login"
  ).catch((err) => {if(err) {
   throw new ApiError(500, "something went wrong");}});
  console.log(user)
 return  res.status(200).json(new ApiResponse("OTP sent successfully", 200, {}));
});
export const verifyOtp = asyncHandler(async (req, res) => {
  const { _id, otp } = req.params;

  if (!_id || !otp) throw new ApiError(404, "otp invalid ot not found");

  const user = await User.findOne({
    loginotp: {token: otp, expiry: {$gt: Date.now()}},
  }).select("-password -accessToken -watchHistory -refreshToken -resetPasswordExpires -accessToken -refreshToken -verifyToken -avatar");


  if (!user) {
    throw new ApiError(404, "User or OTP not found");
  }

  const { accessToken, refreshToken } = await generate_AccessAnd_RefreshToken(
    user?._id
  );

  user.loginotp = { token: null, expiry: null };
  user.save({ validateBeforeSave: false });

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
        user: user,
        accessToken,
        refreshToken,
      })
    );
});

export const clearWHistory = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { watchHistory: [] });
  return res.status(200).json(new ApiResponse("success", 200, {}));
});

export const settings = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const data = await User.findById(_id).select(
    "-password -watchHistory -refreshToken"
  );

  if (!data) throw new ApiError(404, "user not found");

  return res.status(200).json(new ApiResponse("success", 200, data));
});

export const updateBioText = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const { _id } = req.user;
  const updatedUser = await User.findByIdAndUpdate(
    _id,
    {
      $set: { "bio.text": text },
    },
    { new: true }
  ).select("-password -refreshToken -email -fullName -avatar -coverImage");

  return res.status(200).json(new ApiResponse("success", 200, updatedUser));
});

export const addLinksInBio = asyncHandler(async (req, res) => {
  const { name, url } = req.body;
  const { _id } = req.user;
  const data = await User.findByIdAndUpdate(
    _id,
    { $push: { "bio.links": { name, url } } },
    { new: true }
  ).select("-avatar -password -email -fullName -refreshToken");
  return res.status(200).json(new ApiResponse("success", 200, data));
});

export const deleteLinkFromBio = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const { linkId } = req.params;
  await User.findByIdAndUpdate(
    _id,
    {
      $pull: { "bio.links": { _id: new mongoose.Types.ObjectId(linkId) } },
    },
    { new: true }
  ).select(
    "-password -refreshToken -avatar -username -email -coverImage -fullName"
  );

  return res.status(200).json(new ApiResponse("successfully removed", 200, {}));
});

export const getCurrentUserDetails = asyncHandler(async (req, res) => {
  const { _id } = req.user;
  const match = {
    $match: {
      _id: new ObjectId(_id),
    },
  };

  const subLookUp = {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "channel",
      as: "subscribers",
    },
  };

  const videoLookUp = {
    $lookup: {
      from: "videos",
      localField: "_id",
      foreignField: "owner",
      as: "userVideos",
    },
  };

  const addFields = {
    $addFields: {
      totalSubscribers: {
        $size: "$subscribers",
      },
      totalVideos: {
        $size: "$userVideos",
      },
    },
  };

  const project = {
    $project: {
      username: 1,
      avatar: 1,
      coverImage: 1,
      fullName: 1,
      totalSubscribers: 1,
      totalVideos: 1,
      bio: 1,
    },
  };

  const data = await User.aggregate([
    match,
    subLookUp,
    videoLookUp,
    addFields,
    project,
  ]);

  return res.status(201).json(new ApiResponse("success", 201, data[0]));
});

// forgot passowrd
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) throw new ApiError(404, "no email was found");
  const token = crypto.randomBytes(10).toString("hex");
  const user = await User.findOneAndUpdate(
    { email },
    {
      resetPasswordTokem: token,
      resetPasswordExpires: Date.now() + 3600000,
    }
  );
  if (!user) throw new ApiError(404, "email not found");

  await sendEmail(
    email,
    "Reset Password",
    `<a href="http://localhost:3000/reset_password/${token}">Click here to reset your password</a>`
  );
  return res.status(200).json(new ApiResponse("verify email", 200, {}));
});
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) throw new ApiError("invalid token");
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user.resetPasswordToken || !user.resetPasswordExpires)
    throw new ApiError(400, "Password reset token is invalid or has expired");

  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save({ validateBeforeSave: false });

  res.redirect("http://localhost:3000/login");
});
