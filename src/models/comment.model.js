import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const replySchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    replyTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    comment: {
      type: Schema.Types.ObjectId,
      ref: "Comment", // Reference to the parent comment
      required: true,
    },
  },
  { timestamps: true }
);

const commentsSchema = new Schema(
  {
    content: {
      type: String,
      required: true,
    },
    tweet: {
      type: Schema.Types.ObjectId,
      ref: "Tweet",
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: "Video",
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    replies: [replySchema],
  },
  { timestamps: true }
);

commentsSchema.plugin(mongooseAggregatePaginate);
replySchema.plugin(mongooseAggregatePaginate);

export const Comment = mongoose.model("Comment", commentsSchema);
export const Reply = mongoose.model("Reply", replySchema);
