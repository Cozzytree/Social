import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_APIKEY,
  api_secret: process.env.CLOUDINARY_APISECRET,
});

export const deleteImage = async (filepath) => {
  try {
    if (!filepath) return;
    const result = await cloudinary.uploader.destroy(
      filepath,
      { resource_type: "auto" },
      function (result) {
        return result;
      }
    );
    return result;
  } catch (error) {
    throw new error(error.message);
  }
};
