import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fs from "fs";

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
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

//*routes import
import userRouter from "../src/routes/user.routes.js";
import commentRouter from "../src/routes/comment.routes.js";
import tweetRouter from "../src/routes/tweet.routes.js";
import videoRouter from "../src/routes/video.routes.js";
import likeRouter from "../src/routes/like.routes.js";
import subscribe from "../src/routes/subscription.routes.js";
import playlist from "../src/routes/playlist.routes.js";

//*routes declaration

app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/like", likeRouter);
app.use("/api/v1/subscribe", subscribe);
app.use("/api/v1/playlist", playlist);

export default app;

// nodemailer at the end
