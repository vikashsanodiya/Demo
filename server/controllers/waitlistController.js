import Book from "../models/bookModel.js";
import Waitlist from "../models/waitlistModel.js";
import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import sendEmail from "../utils/email.js";

export const getAllWaitlist = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Waitlist.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const waitlist = await features.query;

  res.status(200).json({
    status: "success",
    results: waitlist.length,
    data: {
      waitlist,
    },
  });
});

export const getMyWaitlist = catchAsync(async (req, res, next) => {
  const userId = req.user._id;

  const waitlist = await Waitlist.find({
    waitingList: userId,
  }).populate({
    path: "book",
    select: "_id coverImg title author",
  });

  res.status(200).json({
    status: "success",
    results: waitlist.length,
    data: {
      waitlist,
    },
  });
});

export const addToWaitlist = catchAsync(async (req, res, next) => {
  const { book } = req.body;
  const userId = req.user._id;

  // 1) Check if user is already in waitlist for the book
  const existingQueue = await Waitlist.findOne({
    book,
    waitingList: userId,
  });

  if (existingQueue) {
    return next(
      new AppError("You are already in the waitlist for this book", 400)
    );
  }

  // 2) Check if book is not available in the library
  const bookData = await Book.findById(book);

  if (bookData.availableCopies >= 1) {
    return next(new AppError("Book is available in the library", 400));
  }

  // 3) Check if book is already in waitlist
  const existingWaitlist = await Waitlist.findOne({ book });

  if (existingWaitlist) {
    if (!existingWaitlist.waitingList.includes(userId)) {
      existingWaitlist.waitingList.push(userId);
      await existingWaitlist.save();
    }
  } else {
    await Waitlist.create({
      book,
      waitingList: [userId],
    });
  }

  res.status(201).json({
    status: "success",
    message: "Added to waitlist",
  });
});

export const removeUserFromWaitlist = async (userId, bookId) => {
  const waitlist = await Waitlist.findOne({ book: bookId });

  if (!waitlist) return false;

  const filtered = waitlist.waitingList.filter(
    (user) => user.toString() !== userId.toString()
  );

  waitlist.waitingList = filtered;
  await waitlist.save();

  return waitlist;
};

export const removeFromWaitlist = catchAsync(async (req, res, next) => {
  const user = req.params.id || req.user._id;
  const { book } = req.body;

  const waitlist = await removeUserFromWaitlist(user, book);

  if (waitlist === false) {
    return next(
      new AppError("No waitlist found for this book or the user", 404)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      waitlist,
    },
  });
});

export const notifyUserIfAvailable = async (bookId) => {
  const waitingBook = await Waitlist.findOne({ book: bookId })
    .populate({
      path: "book",
      select: "_id title",
    })
    .populate({
      path: "waitingList",
      select: "_id email",
    });

  if (!waitingBook) return;

  const { book, waitingList } = waitingBook;

  if (waitingList && waitingList.length >= 1) {
    const emails = waitingList.map((user) => user.email);
    const message = `The book "${book.title}", you were waiting for is now available. Visit library as soon as possible to borrow it.`;

    try {
      await sendEmail({
        email: emails,
        subject: `The book ${book.title} - is now available`,
        message,
      });
    } catch (err) {
      console.log("Couldn't send email");
    }
  }
};
