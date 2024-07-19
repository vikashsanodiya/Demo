import mongoose from "mongoose";

const genreSchema = new mongoose.Schema(
  {
    genreName: {
      type: String,
      required: [true, "Genre name is required"],
      trim: true,
      unique: true,
    },
    slug: {
      type: String,
      required: [true, "Genre slug is required"],
      trim: true,
      unique: true,
    },
    imageUrl: {
      type: String,
      required: [true, "Genre image is required"],
    },
  },
  {
    timestamps: true,
  }
);

const Genre = mongoose.model("Genre", genreSchema);

export default Genre;
