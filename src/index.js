import dontenv from "dotenv";
import { connectDB } from "./db/database.js";
import app from "./app.js";

dontenv.config();

connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`server is running at http://localhost:${process.env.PORT}`);
    });

    app.on("error", (err) => {
      console.error(err);
    });
  })
  .catch((err) => {
    console.error("Mongo connection failed", err);
  });

// (async () => {
//   try {
//     await mongoose.connect(`${process.env(MONGODB_URL)}/${DB_NAME}`);
//     app.on("error", (err) => {
//       console.error(err);
//     });
//     app.listen(process.env(PORT), () => {
//       console.log(`app is listening in port ${process.env(PORT)}`);
//     });
//   } catch (err) {
//     console.error(err);
//   }
// })();
