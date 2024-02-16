import dontenv from "dotenv";
import { connectDB } from "./db/database.js";
import app from "./app.js";
// import os from "os";
// import cluster from "cluster";
dontenv.config();

// const cpuCount = os.cpus().length;
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(
        `server is running at http://localhost:${process.env.PORT}, ${process.pid}`
      );
    });

    app.on("error", (err) => {
      console.error(err);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection failed", err);
  });
// if (cluster.isPrimary) {
//   cluster.on("exit", (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} died`);
//     cluster.fork();
//   });
// } else {
//   connectDB();
// }
