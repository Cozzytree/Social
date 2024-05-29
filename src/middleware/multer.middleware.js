import multer from "multer";
import { fileTypeFromBuffer } from "file-type";

const storage = multer.diskStorage({
  destination: function (_, file, cb) {
    cb(null, "./public/temp");
  },
  filename: function (_, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

export const upload = multer({
  storage,
  fileFilter: async function (req, file, cb) {
    try {
      // Check if the detected file type is allowed
      if (["image/jpeg", "image/png", "video/mp4"].includes(file.mimetype)) {
        cb(null, true); // Accept the file
      } else {
        cb(new Error("Invalid file type."), false); // Reject the file
      }
    } catch (error) {
      cb(error); // Pass any error to the multer callback
    }
  },
  limits: { fileSize: 1024 * 1024 * 500 },
});
