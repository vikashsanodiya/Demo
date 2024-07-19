import Book from "../models/bookModel.js";
import Review from "../models/reviewModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import filterObj from "../utils/filterObj.js";

export const addReview = catchAsync(async (req, res, next) => {
  const filteredBody = filterObj(req.body, "book", "ratings", "review");
  filteredBody.member = req.user._id;

  // 1) Check if the id is valid and the book exists
  const book = await Book.findOne({ _id: filteredBody.book });

  if (!book) {
    return next(new AppError("No book found with that ID", 404));
  }

  // 2) Check if user already reviewed this book
  const userReviewedBook = await Review.findOne({
    book: filteredBody.book,
    member: filteredBody.member,
  });

  // 3) If user already reviewed this book, throw error. Otherwise, create review
  if (userReviewedBook) {
    return next(new AppError("You have already reviewed this book", 400));
  }

  const newReview = await Review.create(filteredBody);

  // 4) Update the Book collection with the new review
  await Book.findByIdAndUpdate(
    filteredBody.book,
    { $push: { reviews: newReview._id } },
    { new: true }
  );

  res.status(201).json({
    status: "success",
    data: {
      newReview,
    },
  });
});

export const getAllReviews = catchAsync(async (req, res, next) => {
  const reviews = await Review.find();

  res.status(200).json({
    status: "success",
    results: reviews.length,
    data: {
      reviews,
    },
  });
});

export const getMyReviews = catchAsync(async (req, res, next) => {
  const myReviews = await Review.find({ member: req.user._id });

  res.status(200).json({
    status: "success",
    results: myReviews.length,
    data: {
      reviews: myReviews,
    },
  });
});

export const getBookReviews = catchAsync(async (req, res, next) => {
  const bookReviews = await Review.find({ book: req.params.id });

  res.status(200).json({
    status: "success",
    results: bookReviews.length,
    data: {
      bookReviews,
    },
  });
});

export const updateReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const filteredBody = filterObj(req.body, "ratings", "review");

  // 1) Check if review exists
  const review = await Review.findById(id);
  if (!review) {
    return next(new AppError("No review found with that ID", 404));
  }

  // 2) Check if user is authorized to update review
  if (review.member?._id.toString() !== req.user?._id.toString()) {
    return next(
      new AppError("You are not authorized to update this review", 401)
    );
  }

  // 3) Update review
  const updatedReview = await Review.findByIdAndUpdate(id, filteredBody, {
    new: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      updatedReview,
    },
  });
});

export const deleteReview = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  // 1) Check if review exists
  const review = await Review.findById(id);
  if (!review) {
    return next(new AppError("No review found with that ID", 404));
  }

  // 2) Check if user is authorized to delete review
  if (
    review.member?._id.toString() !== req.user?._id.toString() &&
    req.user?.role !== "librarian"
  ) {
    return next(
      new AppError("You are not authorized to delete this review", 401)
    );
  }

  // 3) Delete review
  await Review.findByIdAndDelete(id);

  res.status(200).json({
    status: "success",
    message: "Review deleted successfully",
  });
});
