import mongoose from "mongoose";
const ObjectId = mongoose.Types.ObjectId;

const bookSchema = new mongoose.Schema(
  {
    bookId: {
      type: Number,
      required: true,
      unique: true,
    },
    coverImg: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    publisher: {
      type: String,
    },
    genres: [
      {
        type: ObjectId,
        ref: "Genre",
      },
    ],
    publicationDate: {
      type: Date,
    },
    bookLanguage: {
      type: String,
      required: true,
    },
    pageCount: {
      type: Number,
      min: 10,
    },
    summary: {
      type: String,
      trim: true,
    },
    totalCopies: {
      type: Number,
      min: 1,
      required: true,
    },
    availableCopies: {
      type: Number,
      min: 0,
      required: true,
    },
    borrowCount: {
      type: Number,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

bookSchema.index({ bookId: 1 }, { unique: true });
bookSchema.index({ title: "text", author: "text" });

bookSchema.virtual("reviews", {
  ref: "Review",
  localField: "_id",
  foreignField: "book",
});

bookSchema.virtual("waitlist", {
  ref: "Waitlist",
  localField: "_id",
  foreignField: "book",
});

const Book = mongoose.model("Book", bookSchema);

export default Book;
