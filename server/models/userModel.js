import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose from "mongoose";
import validator from "validator";

const userSchema = new mongoose.Schema(
  {
    userId: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      validate: [validator.isEmail, "Please provide a valid email address"],
      lowercase: true,
      unique: true,
      trim: true,
    },
    gender: {
      type: String,
      required: [true, "Gender is required"],
      enum: {
        values: ["male", "female"],
        message: "Gender is either: male or female",
      },
    },
    birthDate: {
      type: Date,
    },
    role: {
      type: String,
      enum: {
        values: ["librarian", "member"],
        message: "Role is either: librarian or member",
      },
      default: "member",
    },
    contactNumber: {
      type: String,
      validate: {
        validator: (value) => {
          if (value.length === 0) return true;
          return validator.isMobilePhone(value);
        },
        message: "Please provide a valid contact number",
      },
    },
    photo: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      select: false,
    },
    passwordConfirm: {
      type: String,
      required: [true, "please confirm your password"],
      validate: {
        validator: function (value) {
          return value === this.password;
        },
        message: "Password doesn't match",
      },
      select: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifyToken: {
      type: String,
      select: false,
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.index({ userId: 1 }, { unique: true });

userSchema.virtual("borrowedBooks", {
  ref: "Issue",
  localField: "_id",
  foreignField: "user",
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;

  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimeStamp;
  }

  // False means NOT changed
  return false;
};

userSchema.methods.createVerifyToken = function () {
  const verifyToken = crypto.randomBytes(32).toString("hex");

  this.verifyToken = crypto
    .createHash("sha256")
    .update(verifyToken)
    .digest("hex");

  // console.log({ verifyToken }, this.verifyToken);

  this.verifyExpires = Date.now() + 10 * 60 * 1000;

  return verifyToken;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

const User = mongoose.model("User", userSchema);

export default User;
