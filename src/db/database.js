import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export async function connectDB() {
  console.log(process.env.MONGODB_URL);
  try {
    mongoose.set("strictQuery", false);
    const connectionHost = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );
    console.log(`Mongo db ${connectionHost.connection.host}`);
  } catch (err) {
    console.error("Mongo connection error", err);
  }
}

export default connectDB;
