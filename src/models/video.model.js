import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videosSchema = new Schema(
  {
    videoFile: { type: String, required: true },
    thumbnail: { type: String, required: true },
    thumbnailPublicId: { type: String, required: true },
    videoPublicId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    duration: { type: Number },
    views: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
    owner: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

videosSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model("Video", videosSchema);
