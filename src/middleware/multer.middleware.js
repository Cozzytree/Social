import multer from "multer";

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
  fileFilter: function (req, file, cb) {
    cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 * 500 },
});
