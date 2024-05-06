import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const usersSchema = new Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    verified: { type: Boolean, default: false },
    role: { type: String, default: "regular" },
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, index: true },
    password: { type: String, required: [true, "password is required"] },
    avatar: { type: String },
    avatarPublicId: { type: String, required: true },
    coverImage: { type: String },
    coverImagePublicId: { type: String, required: true },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    refreshToken: { type: String, default: "" },
    accessToken: { type: String, default: "" },
    bio: {
      text: { type: String, required: false },
      links: [
        {
          name: { type: String, required: false },
          url: { type: String, required: false },
        },
      ],
    },
    verifyToken: {
      type: Object,
      default: { token: null, expiry: null },
    },
    loginToken: { type: String },
    loginExpiry: { type: Date },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

usersSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  // if password is modified bcrypt the password.
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

usersSchema.methods.checkPassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

usersSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      avatar: this.avatar,
      fullName: this.fullName,
      username: this.username,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  );
};

usersSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  );
};
export const User = mongoose.model("User", usersSchema);
