import User from "../models/userModel.js";
import APIFeatures from "../utils/apiFeatures.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import filterObj from "../utils/filterObj.js";

export const getAllUsers = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(User.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();

  const users = await features.query;

  res.status(200).json({
    status: "success",
    results: users.length,
    data: {
      users,
    },
  });
});

export const getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user._id);

  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});

export const updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        "This route is not for password updates. Please use /updateMyPassword.",
        400
      )
    );
  }

  // 2) Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = filterObj(
    req.body,
    "name",
    "gender",
    "birthDate",
    "contactNumber",
    "photo"
  );

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: "success",
    data: {
      user: updatedUser,
    },
  });
});

export const updateUserRole = catchAsync(async (req, res, next) => {
  const role = req.body.role;
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError("No user found with that ID", 404));
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    {
      new: true,
      runValidators: true,
    }
  );

  res.status(200).json({
    status: "success",
    message: "User role updated successfully",
    data: {
      user: updatedUser,
    },
  });
});
