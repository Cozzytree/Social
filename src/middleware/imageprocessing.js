import ApiError from "../utils/apiError.js";
import fs from "fs";
import sharp from "sharp";
import { pipeline } from "stream";
import { asyncHandler } from "../utils/asyncHandler.js";

export const imageProcessor = asyncHandler(async (req, res, next) => {
  if (req?.file?.mimetype === "image/png") {
    //read file stream
    const readStream = fs.createReadStream(req.file.path);

    // modifying file path
    const outPutFilePath = req.file.path;
    const linkParts = outPutFilePath.split(".");
    linkParts.pop();
    linkParts.push("jpg");
    const newPathName = linkParts.join(".");

    //write file stream stream
    const writeStream = fs.createWriteStream(newPathName);

    pipeline(readStream, sharp().jpeg(), writeStream, (err) => {
      if (err) {
        throw new ApiError(400, "failed to process image");
      } else {
        fs.unlinkSync(req.file.path);
        req.file.path = newPathNmae;
        console.log("Pipeline succeeded");
      }
    });
  } else if (req?.files) {
    for (const key in req.files) {
      if (Object.hasOwnProperty.call(req.files, key)) {
        const filesArray = req.files[key];
        for (const file of filesArray) {
          if (file?.mimetype === "image/png") {
            //read file stream
            const readStream = fs.createReadStream(file.path);

            // modifying file path
            const outPutFilePath = file.path;
            const linkParts = outPutFilePath.split(".");
            linkParts.pop();
            linkParts.push("jpg");
            const newPathName = linkParts.join(".");

            //write file stream
            const writeStream = fs.createWriteStream(newPathName);

            pipeline(readStream, sharp().jpeg(), writeStream, (err) => {
              if (err) {
                throw new ApiError(400, "failed to process image");
              } else {
                fs.unlinkSync(file.path); // Delete the original PNG file
              }
            });
          }
        }
      }
    }
  }

  return next();
});
