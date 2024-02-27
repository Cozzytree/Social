import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { deleteImage } from "./cloudinaryDelete.js";
import { pipeline } from "stream";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
});

let response;

export async function uploadInCloudinary(localFilepath) {
  try {
    if (!localFilepath) return null;

    const uploadOptions = {
      resource_type: "auto",
      media_metadata: true,
    };

    response = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            throw new Error(error);
            console.log("error", error);
          } else {
            resolve(result);
          }
        }
      );
      const fileStream = fs.createReadStream(localFilepath);
      pipeline(fileStream, uploadStream, (error) => {
        if (error) console.log("pipeline", error);
      });
    });

    // Remove the local file after upload
    console.log("response", response);
    fs.unlinkSync(localFilepath);
    return response;
  } catch (error) {
    if (error) {
      deleteImage(response?.public_id);
    }
    console.error("Error uploading to Cloudinary:", error);
    return null;
  }
}
