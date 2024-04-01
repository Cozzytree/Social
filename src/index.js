import dontenv from "dotenv";
import { connectDB } from "./db/database.js";
import app from "./app.js";
// import os from "os";
// import cluster from "cluster";
dontenv.config();

function startServer() {
  connectDB()
    .then(() => {
      app.listen(process.env.PORT || 8000, () => {
        console.log(
          `Server is running at http://localhost:${process.env.PORT}, ${process.pid}`
        );
      });

      // app.on("error", (err) => {
      //   console.error ( "what error"+err);
      // });
    })
    .catch((err) => {
      console.error("MongoDB connection failed", err);
      // if (err) return startServer();
    });
}

startServer();
