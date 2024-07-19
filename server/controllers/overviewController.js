import Book from "../models/bookModel.js";
import Issue from "../models/issueModel.js";
import Review from "../models/reviewModel.js";
import User from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";

export const getOverview = catchAsync(async (req, res, next) => {
  const totalBooks = await Book.countDocuments();
  const totalUsers = await User.countDocuments({ role: "member" });
  const totalReviews = await Review.countDocuments();

  const issuedBooks = await Book.aggregate([
    {
      $project: {
        difference: { $subtract: ["$totalCopies", "$availableCopies"] },
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$difference" },
      },
    },
  ]);

  const totalIssuedBooks = await Book.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$borrowCount" },
      },
    },
  ]);

  const totalFineCollected = await Issue.aggregate([
    {
      $match: {
        status: "returned",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$delayedFine" },
      },
    },
  ]);

  return res.status(200).json({
    status: "success",
    data: {
      totalBooks,
      totalUsers,
      totalReviews,
      totalIssuedBooks: totalIssuedBooks[0]?.total || 0,
      issuedBooks: issuedBooks[0]?.total || 0,
      totalFineCollected: totalFineCollected[0]?.total || 0,
    },
  });
});

export const getMemberOverview = catchAsync(async (req, res, next) => {
  const id = req.user._id;

  const totalBorrowed = await Issue.countDocuments({ user: id });
  const totalReviews = await Review.countDocuments({ member: id });

  const currentlyBorrowed = await Issue.countDocuments({
    user: id,
    status: "issued",
  });

  const totalReturned = await Issue.countDocuments({
    user: id,
    status: "returned",
  });

  const delayedBooks = await Issue.countDocuments({
    user: id,
    status: "issued",
    estimatedReturnDate: { $lt: new Date() },
  });

  const totalFinePaid = await Issue.aggregate([
    {
      $match: {
        user: id,
        status: "returned",
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: "$delayedFine" },
      },
    },
  ]);

  return res.status(200).json({
    status: "success",
    data: {
      totalBorrowed,
      totalReviews,
      currentlyBorrowed,
      totalReturned,
      delayedBooks,
      totalFinePaid: totalFinePaid[0]?.total || 0,
    },
  });
});
