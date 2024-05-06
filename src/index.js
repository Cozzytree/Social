import { connectDB } from "./db/database.js";
import app from "./app.js";
import os from "os";
import cluster from "cluster";

connectDB();
// function startServer() {
//   connectDB()
//     .then(() => {
//       if (cluster.isPrimary) {
//         console.log(`Primary ${process.pid} is running`);

//         // Fork workers.
//         for (let i = 0; i < os.cpus().length; i++) {
//           cluster.fork();
//         }

//         cluster.on("exit", (worker, code, signal) => {
//           console.log(`worker ${worker.process.pid} died`);
//         });
//       } else {
//         // Workers can share any TCP connection
//         // In this case it is an HTTP server
//         app.listen(process.env.PORT || 8001, () => {
//           console.log(
//             `Server is running at http://localhost:${process.env.PORT}, ${process.pid}`
//           );
//         });
//         console.log(`Worker ${process.pid} started`);
//       }
//     })
//     .catch((err) => {
//       console.error("MongoDB connection failed", err);
//       // if (err) return startServer();
//     });
// }

function startServer() {
  if (cluster.isPrimary) {
    for (let i = 0; i < os.cpus().length; i++) {
      cluster.fork();
    }

    cluster.on("exit", (worker, code, signal) => {
      console.log(`worker ${worker.process.pid} died`);
    });
  } else {
    app.listen(process.env.PORT || 8001, () => {
      console.log(
        `Server is running at http://localhost:${process.env.PORT}, ${process.pid}`
      );
    });
  }
}

startServer();
