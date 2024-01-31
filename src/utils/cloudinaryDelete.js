import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
  secure: true,
});

export const deleteImage = async (publicId) => {
  try {
    if (!publicId) return;
    await cloudinary.uploader.destroy(publicId, function (result) {
      return result;
    });
  } catch (error) {
    throw error;
  }
};
