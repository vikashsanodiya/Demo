import Book from "../models/bookModel.js";
import Genre from "../models/genreModel.js";
import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const getAllGenres = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Genre.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const genres = await features.query;

  res.status(200).json({
    status: "success",
    results: genres.length,
    data: {
      genres,
    },
  });
});

export const addGenre = catchAsync(async (req, res, next) => {
  const { genreName, imageUrl, slug } = req.body;

  const genre = await Genre.create({ genreName, imageUrl, slug });

  res.status(201).json({
    status: "success",
    data: {
      genre,
    },
  });
});

export const updateGenre = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { genreName, imageUrl, slug } = req.body;

  const genre = await Genre.findByIdAndUpdate(
    id,
    { genreName, imageUrl, slug },
    { new: true },
    { runValidators: true }
  );

  res.status(200).json({
    status: "success",
    data: {
      genre,
    },
  });
});

export const deleteGenre = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  const book = await Book.findOne({ genres: id });

  if (book) {
    return next(
      new AppError(
        "There are books under this genre. Please delete or change them before deleting the genre"
      ),
      409
    );
  }

  const genre = await Genre.findByIdAndDelete(id);

  if (!genre) {
    return next(new AppError("Genre not found", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Genre deleted!",
  });
});
