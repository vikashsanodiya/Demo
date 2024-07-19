import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

const issueSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: "User",
      required: true,
    },
    book: {
      type: ObjectId,
      ref: "Book",
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
    },
    estimatedReturnDate: {
      type: Date,
      required: true,
    },
    returnDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["issued", "returned"],
      required: true,
    },
    delayedFine: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);
const Issue = mongoose.model("Issue", issueSchema);

export default Issue;
