import mongoose, { Schema } from "mongoose";

const videosSchema = new Schema(
  {
    videoFile: { type: String, required: true },
    thumbnail: { type: String },
    title: { type: String, required: true },
    description: { type: String },
    duration: { type: Number },
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

videosSchema.plugin();
export const Video = mongoose.model("Video", videosSchema);
