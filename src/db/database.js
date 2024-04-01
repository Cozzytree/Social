import dotenv from "dotenv";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

dotenv.config();

const uri = process.env.MONGODB_URL;
const clientOptions = { serverApi: { version: '1', strict: true, deprecationErrors: true } };


export async function connectDB() {
  try {

    mongoose.set("strictQuery", false);
    const connectionHost = await mongoose.connect(uri, clientOptions);
    console.log(`MongoDB connected to ${connectionHost.connection.host}`);
  } catch (err) {
 if(err) 
     console.log("mongo db connection error", err);
   }
};

export default connectDB;