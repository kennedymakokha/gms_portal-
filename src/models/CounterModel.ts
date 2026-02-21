import mongoose, { Schema, Document } from "mongoose";

export interface ICounter extends Document {
  clinic: mongoose.Types.ObjectId;
  key: string;
  seq: number;
}

const CounterSchema: Schema = new Schema(
  {
    clinic: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Clinic",
    },
    branch: {
      type: Schema.Types.ObjectId,
      ref: "branch",
      required: true,
      index: true,
    },
    key: {
      type: String,
      required: true,
    },
    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Prevent duplicate counters per clinic + key
CounterSchema.index({ clinic: 1, key: 1 }, { unique: true });

const Counter = mongoose.model<ICounter>("Counter", CounterSchema);

export default Counter;
