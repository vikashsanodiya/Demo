import mongoose from "mongoose";

const counterSchema = new mongoose.Schema(
  {
    userSequence: {
      type: Number,
      default: 100,
    },
    bookSequence: {
      type: Number,
      default: 100,
    },
  },
  {
    timestamps: true,
  }
);

const Counter = mongoose.model("Counter", counterSchema);

export default Counter;
