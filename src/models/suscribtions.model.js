import mongoose, { Mongoose, Schema } from "mongoose";

const suscribtionsSchema = new Schema(
  {
    suscriber: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    channnel: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const Suscription = mongoose.model("Suscription", suscribtionsSchema);
