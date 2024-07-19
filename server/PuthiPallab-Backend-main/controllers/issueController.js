import Book from "../models/bookModel.js";
import Issue from "../models/issueModel.js";
import User from "../models/userModel.js";
import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import {
  notifyUserIfAvailable,
  removeUserFromWaitlist,
} from "./waitlistController.js";

export const getAllIssues = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(
    Issue.find()
      .populate({
        path: "user",
        select: "_id name userId",
      })
      .populate({
        path: "book",
        select: "_id title coverImg bookId",
      }),
    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const issues = await features.query;

  res.status(200).json({
    status: "success",
    results: issues.length,
    data: {
      issues,
    },
  });
});

export const getIssue = catchAsync(async (req, res, next) => {
  const { bookId, userId } = req.params;

  // Check if book exists
  const book = await Book.findOne({ bookId }).select(
    "_id title coverImg bookId"
  );

  if (!book) {
    return next(new AppError("No book found with that ID", 404));
  }

  // Check if user exists
  const user = await User.findOne({ userId }).select("_id name userId");

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  // Check if issue exists
  const issue = await Issue.findOne({
    book: book._id,
    user: user._id,
    status: "issued",
  });

  if (!issue) {
    return next(
      new AppError("This book is not currently issued to this user", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      issue: {
        _id: issue._id,
        book,
        user,
        issueDate: issue.issueDate,
        estimatedReturnDate: issue.estimatedReturnDate,
      },
    },
  });
});

export const getMyIssues = catchAsync(async (req, res, next) => {
  req.query.user = req.user._id;
  next();
});

export const issueBook = catchAsync(async (req, res, next) => {
  const { user, book, issueDate, estimatedReturnDate } = req.body;

  // 1) Check if user already borrowed this book
  const existingIssue = await Issue.findOne({ user, book, status: "issued" });

  if (existingIssue) {
    return next(new AppError("This book is already issued to this user", 400));
  }

  // 2) Check if book is available
  const bookData = await Book.findById(book);

  if (!bookData || bookData.availableCopies === 0) {
    return next(new AppError("This book is not available", 400));
  }

  // 3) Check if user already borrowed 3 books
  const userIssues = await Issue.find({ user, status: "issued" });

  if (userIssues.length >= 3) {
    return next(new AppError("You have already borrowed 3 books", 400));
  }

  // 4) Create new issue
  const issue = await Issue.create({
    user,
    book,
    issueDate,
    estimatedReturnDate,
    status: "issued",
  });

  // 5) Update book data
  bookData.availableCopies -= 1;
  bookData.borrowCount += 1;
  await bookData.save();

  // 6) Remove user from waitlist if exists
  await removeUserFromWaitlist(user, book);

  res.status(201).json({
    status: "success",
    data: {
      issue,
    },
  });
});

export const returnBook = catchAsync(async (req, res, next) => {
  const { user, book, returnDate, delayedFine } = req.body;

  // 1) Check if issues exists and update it
  const issue = await Issue.findOneAndUpdate(
    { user, book, status: "issued" },
    { returnDate, delayedFine, status: "returned" },
    { new: true }
  );

  // 2) If no issue exists, return error
  if (!issue) {
    return next(new AppError("No such issue exists", 404));
  }

  // 3) Update book data
  const bookData = await Book.findById(book);
  bookData.availableCopies += 1;
  await bookData.save();

  // 4) Check if waiting user should be notified (if any)
  if (bookData.availableCopies === 1) await notifyUserIfAvailable(book);

  res.status(200).json({
    status: "success",
    data: {
      issue,
    },
  });
});
