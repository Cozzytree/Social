import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { User, User } from "../models/user.model.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";

async function generate_AccessAnd_RefreshToken(id) {
  try {
    const user = await User.findById(id);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "something went wrong while generating tokens");
  }
}

export const registerUser = asyncHandler(async (req, res) => {
  // get data from user
  const { username, email, password, fullName } = req.body;

  if (
    [username, email, fullName, fullName].some(
      (fields) => fields?.trim() === ""
    )
  ) {
    throw new ApiError(400, "All fields are required");
  }

  //*check for existing user
  const existedUser = await User.findOne({ email });
  if (existedUser) {
    throw new ApiError(409, "Username or email already exists");
  }

  //* check avatar Image
  let coverImagePath;
  let avatarPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImage = req?.files?.coverImage[0]?.path;
  }

  if (
    req.files &&
    Array.isArray(req.files.avatar) &&
    req.files.avatar.length > 0
  ) {
    avatarPath = req?.files?.coverImage[0]?.path;
  }

  if (!avatarPath) {
    throw new ApiError(400, "Avatar is required");
  }

  //*upload image
  const avatar = await uploadInCloudinary(avatarPath);
  const coverImage = await uploadInCloudinary(coverImagePath);
  if (!avatar) {
    throw new ApiError(500, "error while uploading");
  }

  //*create userObject
  const user = await User.create({
    username: username.toLowerCase(),
    fullName,
    email,
    password,
    avatar: avatar,
    coverImage: coverImage || "",
  });

  //* removing password and refreshToken from sending response.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(500, "Something went wrong while creating user");

  return res
    .status(201)
    .json(new ApiResponse("user successfully registered", 201, createdUser));
});

export const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  //* Check if email or username is recieved
  if (!email || !username) {
    throw new ApiError(401, "Username or password is required");
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
  const userObject = { ...user };
  for (const prop of ["password", "refreshToken"]) {
    delete userObject[prop];
  }

  //* Response
  const options = { httpOnly: true, secure: true };

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
