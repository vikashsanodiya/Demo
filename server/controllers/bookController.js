import Book from "../models/bookModel.js";
import Counter from "../models/counterModel.js";
import Issue from "../models/issueModel.js";
import Review from "../models/reviewModel.js";
import Waitlist from "../models/waitlistModel.js";
import APIFeatures from "../utils/apiFeatures.js";
import catchAsync from "../utils/catchAsync.js";
import filterObj from "../utils/filterObj.js";
import { notifyUserIfAvailable } from "./waitlistController.js";

export const getAllBooks = catchAsync(async (req, res, next) => {
  const { search } = req.query;
  let searchQuery = {};

  if (search) {
    searchQuery = {
      $or: [
        { title: { $regex: search, $options: "i" } },
        { author: { $regex: search, $options: "i" } },
      ],
    };
  }

  const totalFeatures = new APIFeatures(Book.find(searchQuery), req.query)
    .filter()
    .genreFilter()
    .languageFilter();

  const totalBooks = await totalFeatures.query.countDocuments();

  const features = new APIFeatures(Book.find(searchQuery), req.query)
    .filter()
    .genreFilter()
    .languageFilter()
    .sort()
    .limitFields()
    .paginate();

  if (!req.query.fields || req.query.fields.includes("genres")) {
    features.query = features.query.populate({
      path: "genres",
      select: "_id genreName imageUrl slug",
    });
  }

  const books = await features.query;

  res.status(200).json({
    status: "success",
    total: totalBooks,
    results: books.length,
    data: {
      books,
    },
  });
});

export const getBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id)
    .populate({
      path: "genres",
      select: "_id genreName imageUrl",
    })
    .populate({
      path: "reviews",
      select: "_id ratings review createdAt -book",
    })
    .populate({
      path: "waitlist",
      select: "_id waitingList -book",
    });

  res.status(200).json({
    status: "success",
    data: {
      book,
    },
  });
});

export const addMultipleBooks = catchAsync(async (req, res, next) => {
  const sequence = await Counter.findOne({});

  const books = req.body.map((book, index) => {
    const filteredData = filterObj(
      book,
      "coverImg",
      "title",
      "author",
      "publisher",
      "genres",
      "publicationDate",
      "bookLanguage",
      "pageCount",
      "summary",
      "totalCopies"
    );

    filteredData.availableCopies = filteredData.totalCopies;
    filteredData.bookId = sequence.bookSequence + index;

    return filteredData;
  });

  const insertedBooks = await Book.insertMany(books);

  sequence.bookSequence += books.length;
  await sequence.save();

  res.status(201).json({
    status: "success",
    data: {
      books: insertedBooks,
    },
  });
});

export const addBook = catchAsync(async (req, res, next) => {
  const sequence = await Counter.findOne({});

  const filteredData = filterObj(
    req.body,
    "coverImg",
    "title",
    "author",
    "publisher",
    "genres",
    "publicationDate",
    "bookLanguage",
    "pageCount",
    "summary",
    "totalCopies"
  );

  filteredData.availableCopies = filteredData.totalCopies;
  filteredData.bookId = sequence.bookSequence;

  const book = await Book.create(filteredData);

  sequence.bookSequence += 1;
  await sequence.save();

  res.status(201).json({
    status: "success",
    data: {
      book,
    },
  });
});

export const updateBook = catchAsync(async (req, res, next) => {
  const book = await Book.findById(req.params.id);

  if (!book) {
    return next(new AppError("No book found with that ID", 404));
  }

  const filteredData = filterObj(
    req.body,
    "coverImg",
    "title",
    "author",
    "publisher",
    "genres",
    "publicationDate",
    "bookLanguage",
    "pageCount",
    "summary",
    "totalCopies"
  );

  if (filteredData.totalCopies !== undefined) {
    filteredData.availableCopies =
      book.availableCopies + filteredData.totalCopies - book.totalCopies;
  }

  const updatedBook = await Book.findByIdAndUpdate(
    req.params.id,
    filteredData,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!updatedBook) {
    return next(new AppError("Book couldn't be updated", 404));
  }

  // Check if waiting user should be notified (if any)
  if (book.availableCopies === 0 && filteredData.availableCopies) {
    await notifyUserIfAvailable(book);
  }

  res.status(200).json({
    status: "success",
    data: {
      updatedBook,
    },
  });
});

export const deleteBook = catchAsync(async (req, res, next) => {
  const deletedBook = await Book.findByIdAndDelete(req.params.id);

  if (!deletedBook) {
    return next(new AppError("No book found with that ID", 404));
  }

  // Delete all reviews, waitlist entries and issues related to the book
  await Review.deleteMany({ book: req.params.id });
  await Waitlist.deleteOne({ book: req.params.id });
  await Issue.deleteMany({ book: req.params.id });

  res.status(200).json({
    status: "success",
    data: null,
  });
});
