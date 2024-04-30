import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import fs from "fs";
//*routes import
import userRouter from "../src/routes/user.routes.js";
import commentRouter from "../src/routes/comment.routes.js";
import tweetRouter from "../src/routes/tweet.routes.js";
import videoRouter from "../src/routes/video.routes.js";
import likeRouter from "../src/routes/like.routes.js";
import subscribe from "../src/routes/subscription.routes.js";
import playlist from "../src/routes/playlist.routes.js";
import ApiResponse from "./utils/apiResponse.js";

const app = express();

// middlewares
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    optionsSuccessStatus: 201,
    exposedHeaders: "Set-Cookie",
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: [
      "Access-Control-Allow-Origin",
      "Content-Type",
      "Authorization",
    ],
  })
);
app.use((err, _, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.file) {
      const filePath = err.file.path;
      fs.unlink(filePath);
    } else {
      res.status(400).json(new ApiResponse("error while uploading", 402, {}));
    }
  } else {
    next();
  }
});
function timeoutMiddleware(req, res, next) {
  // Set the timeout duration (in milliseconds)
  const timeoutDuration = 20000;
  // Set a timeout for the request
  const timeout = setTimeout(() => {
    // If the timeout occurs, respond with a timeout error
    return res.status(504).json(new ApiResponse("server timed out", 504, {}));
  }, timeoutDuration);
  // Call next() to pass the request to the next middleware/route handler
  next();
  // Clear the timeout when the response is finished or an error occurs
  res.on("finish", () => {
    clearTimeout(timeout);
  });
}
app.use(timeoutMiddleware);
app.use(express.json({ limit: "15kb" }));
app.use(express.urlencoded({ extended: true, limit: "15kb" }));
app.use(express.static("public"));
app.use(cookieParser());

// app.use((req, _, next) => {
//   fs.appendFile(
//     "log.txt",
//     `\n${Date.now()} : ${req.ip} : ${req.method} : ${req.path}`,
//     () => {
//       next();
//     }
//   );
// });

// app.use((err, req, res, next) => {
//   res.locals.error = err;
//   const status = err.status || 500;
//   res.status(status);
//   res.render("error");
//   next();
// });

//*routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/subscribe", subscribe);
app.use("/api/v1/playlist", playlist);

export default app;

// app.get("/progress", (req, res) => {
//   res.setHeader("Content-Type", "text/event-stream");
//   res.setHeader("Cache-Control", "no-cache");
//   res.setHeader("Connection", "keep-alive");

//   const sendProgress = (percentage) => {
//     res.write(`data: ${JSON.stringify({ progress: percentage })}\n\n`);
//   };

//   // Subscribe to progress events from Multer
//   upload.on("progress", (bytesReceived, bytesExpected) => {
//     const percentage = (bytesReceived / bytesExpected) * 100;
//     sendProgress(percentage.toFixed(2));
//   });
// });

// const eventSource = new EventSource("/progress");
// const progressDiv = document.getElementById("progress");

// eventSource.onmessage = function (event) {
//   const data = JSON.parse(event.data);
//   const progress = data.progress;
//   progressDiv.innerText = `Upload progress: ${progress}%`;
// };

// eventSource.onerror = function (error) {
//   console.error("EventSource failed:", error);
//   eventSource.close();
// };
