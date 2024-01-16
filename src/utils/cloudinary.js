import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
});

export async function uploadInCloudinary(localFilepath) {
  try {
    if (!localFilepath) return;

    const response = await cloudinary.uploader.upload(localFilepath, {
      resource_type: "auto",
    });

    fs.unlinkSync(localFilepath);

    return response?.secure_url;
  } catch (error) {
    fs.unlinkSync(localFilepath);
    return null;
  }
}
