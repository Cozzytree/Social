import { pipeline } from "stream";
import { asyncHandler } from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import fs from "fs";
import sharp from "sharp";

export const imageProcessor = asyncHandler(async (req, res, next) => {
  console.log(req.file);
  if (req.file.mimetype === "image/png") {
    //read file stream
    const readStream = fs.createReadStream(req.file.path);

    // modifying file path
    const outPutFilePath = req.file.path;
    const linkParts = outPutFilePath.split(".");
    linkParts.pop();
    linkParts.push("jpg");
    const newPathNmae = linkParts.join(".");

    //write file stream stream
    const writeStream = fs.createWriteStream(newPathNmae);

    pipeline(readStream, sharp().jpeg(), writeStream, (err) => {
      if (err) {
        throw new ApiError(400, "failed to process image");
      } else {
        fs.unlinkSync(req.file.path);
        req.file.path = newPathNmae;
        console.log("Pipeline succeeded");
      }
    });
  } else {
    for (const file of req.files) {
      if (file.mimetype === "image/png") {
        try {
          const jpegBuffer = await sharp(fs.readFileSync(file.path))
            .jpeg()
            .toBuffer();
          fs.writeFileSync(file.path, jpegBuffer); // Overwrite the file with JPEG data
          file.mimetype = "image/jpeg";
        } catch (err) {
          if (err) {
            return res
              .status(400)
              .json(new ApiResponse("error while processing image", 400, {}));
          }
        }
      }
    }
  }

  return next();
});
