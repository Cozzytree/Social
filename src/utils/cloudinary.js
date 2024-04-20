import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
import { deleteImage } from "./cloudinaryDelete.js";
import { pipeline } from "stream";
import ApiError from "./apiError.js";
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
            reject(new Error(error.message));
          } else {
            resolve(result);
          }
        }
      );
      const fileStream = fs.createReadStream(localFilepath);
      pipeline(fileStream, uploadStream, (error) => {
        if (error) {
          reject(new ApiError(500, "Error while uploading"));
        }
      });
    });

    // Delete the local file after successful upload
    fs.unlinkSync(localFilepath);

    return response;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    // If an error occurs, attempt to delete the uploaded image
    if (response?.public_id) {
      await deleteImage(response.public_id);
    }
    // Rethrow the error for higher-level handling
    throw error;
  }
}
