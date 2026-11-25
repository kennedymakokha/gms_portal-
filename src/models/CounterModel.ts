
import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICounter extends Document {
  pharmacy: Types.ObjectId;
  branch: Types.ObjectId;
  key: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    pharmacy: {
      type: Schema.Types.ObjectId,
      ref: "Pharmacy",
      required: true,
      index: true,
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
      trim: true,
    },

    seq: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// One counter per pharmacy, branch and counter key.
CounterSchema.index(
  { pharmacy: 1, branch: 1, key: 1 },
  { unique: true }
);

const Counter = mongoose.model<ICounter>(
  "Counter",
  CounterSchema
);

export default Counter;
