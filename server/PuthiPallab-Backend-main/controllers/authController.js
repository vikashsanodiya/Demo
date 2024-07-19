import crypto from "crypto";
import jwt from "jsonwebtoken";
import { promisify } from "util";
import Counter from "../models/counterModel.js";
import User from "../models/userModel.js";
import AppError from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
import sendEmail from "../utils/email.js";

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const cookieOptions = {
  httpOnly: true,
  path: "/",
  secure: true,
  sameSite: "None",
  maxAge: process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000, // 90 days
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;

  res.cookie("jwt", token, cookieOptions);

  res.status(statusCode).json({
    status: "success",
    data: {
      user,
    },
  });
};

export const sendVerificationEmail = async (user, res, next) => {
  // Generate verification token
  const verifyToken = await user.createVerifyToken();
  await user.save({ validateBeforeSave: false });

  // Send it to user's email
  const verifyURL = `${process.env.FRONTEND_URL}/verify-email/${verifyToken}`;

  const message = `Welcome to Puthi Pallab! Please verify your email address by clicking the link below.\n${verifyURL}`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your email verification token (valid for 10 min)",
      message,
    });

    res.status(201).json({
      status: "success",
      message: "Verification email sent to your email!",
    });
  } catch (err) {
    user.verifyToken = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
};

export const signup = catchAsync(async (req, res, next) => {
  const { name, email, gender, password, passwordConfirm } = req.body;

  const sequence = await Counter.findOne({});

  const newUser = await User.create({
    name,
    email,
    gender,
    password,
    passwordConfirm,
    userId: sequence.userSequence,
  });

  sequence.userSequence += 1;
  await sequence.save();

  // Send Verification Email
  await sendVerificationEmail(newUser, res, next);
});

export const login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  // 3) Check if user is verified
  if (!user.isVerified) {
    return res.status(403).json({
      status: "fail",
      isVerified: false,
      message: "Please verify your email address",
    });
  }

  // 4) If everything ok, send token to client
  return createSendToken(user, 200, res);
});

export const logout = catchAsync(async (req, res, next) => {
  res.cookie("jwt", "", cookieOptions);

  res.status(200).json({
    status: "success",
    message: "Logged out successfully",
  });
});

export const verifyEmail = catchAsync(async (req, res, next) => {
  // 1) Get user based on token
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    verifyToken: hashedToken,
  });

  if (!user) {
    return next(new AppError("Token is invalid or expired"));
  }

  // 2) If token is valid and user is found, set user to verified
  user.isVerified = true;
  user.verifyToken = undefined;
  await user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: "success",
    isVerified: true,
    message: "Email verified",
  });
});

export const resendVerificationEmail = catchAsync(async (req, res, next) => {
  const { email } = req.body;

  // 1) Check if email exists
  if (!email) {
    return next(new AppError("Please provide email!", 400));
  }

  // 2) Check if user exists
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("User does not exist", 404));
  }

  // 3) Check if user is verified
  if (user.isVerified) {
    return res.status(403).json({
      status: "fail",
      isVerified: true,
      message: "User is already verified",
    });
  }

  // 4) Send Verification Email
  await sendVerificationEmail(user, res, next);
});

export const protect = catchAsync(async (req, res, next) => {
  // 1) Getting token and check if it's there
  const token = req.cookies?.jwt;

  if (!token) {
    return next(
      new AppError("You are not logged in! Please log in to get access.", 401)
    );
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError("The user belonging to this token no longer exists.", 401)
    );
  }

  // 4) Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError("User recently changed password! Please log in again.", 401)
    );
  }

  // GRANT ACCESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});

export const restrictTo = (...roles) => {
  return catchAsync(async (req, res, next) => {
    const { role } = req.user;

    if (!roles.includes(role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }

    next();
  });
};

export const forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = await user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

export const resetPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on the token
  const { token } = req.params;
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new AppError("Token is invalid or has expired", 400));
  }

  // 2) If token has not expired, and there is user, set the new password
  const { password, passwordConfirm } = req.body;
  user.password = password;
  user.passwordConfirm = passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user

  // 4) Log the user in, send JWT
  return createSendToken(user, 200, res);
});

export const updatePassword = catchAsync(async (req, res, next) => {
  // 1) Get user from collection
  // const { user } = req;
  const { passwordCurrent, newPassword, newPasswordConfirm } = req.body;
  const user = await User.findById(req.user._id).select("+password");

  if (!passwordCurrent || !newPassword || !newPasswordConfirm) {
    return next(
      new AppError(
        "Please provide your current password and new password and confirm new password",
        400
      )
    );
  }

  // 2) Check if POSTed current password is correct
  if (!(await user.correctPassword(passwordCurrent, user.password))) {
    return next(new AppError("Your current password is wrong.", 401));
  }

  // 3) If so, update password
  user.password = newPassword;
  user.passwordConfirm = newPasswordConfirm;
  await user.save();

  // 4) Log user in, send JWT
  return createSendToken(user, 200, res);
});
