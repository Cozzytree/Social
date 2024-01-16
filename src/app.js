import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "15kb" }));
app.use(express.urlencoded({ extended: true, limit: "15kb" }));
app.use(express.static("public"));
app.use(cookieParser());

//*routes import

import userRouter from "../src/routes/user.routes.js";
import commentRouter from "../src/routes/comment.routes.js";
import tweetRouter from "../src/routes/tweet.routes.js";
import videoRouter from "../src/routes/video.routes.js";
import likeRouter from "../src/routes/like.routes.js";

//*routes declaration
app.use("/api/v1/users", userRouter);
app.use("/api/v1/comments", commentRouter);
app.use("/api/v1/tweet", tweetRouter);
app.use("/api/v1/videos", videoRouter);
app.use("/api/v1/like", likeRouter);

export default app;
