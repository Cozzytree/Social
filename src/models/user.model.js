import mongoose, { Schema, mongo } from "mongoose";
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
    email: { type: String, required: true, unique: true },
    fullName: { type: String, required: true, index: true },
    password: { type: String, required: [true, "password is required"] },
    avatar: { type: String },
    avatarPublicId: { type: String, required: true },
    coverImage: { type: String },
    coverImagePublicId: { type: String, required: true },
    watchHistory: [{ type: Schema.Types.ObjectId, ref: "Video" }],
    refreshToken: { type: String },
    bio: {
      text: { type: String, required: false },
      links: [
        {
          name: { type: String, required: false },
          url: { type: String, required: false },
        },
      ],
    },
    otp: {
      type: Object,
      default: null,
    },
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
