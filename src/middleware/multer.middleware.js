import multer from "multer";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // console.log("multer", file, req);
    //* callback for the destination of where the file is kept null = no error
    cb(null, "./public/temp");
  },

  filename: function (req, file, cb) {
    //     const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.originalname);
  },
});

export const upload = multer({ storage });
