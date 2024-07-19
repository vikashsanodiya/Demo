import cookieParser from "cookie-parser";
import cors from "cors";
import "dotenv/config.js";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import xss from "xss-clean";

import globalErrorHander from "./controllers/errorController.js";
import bookRouter from "./routes/bookRoutes.js";
import contactRouter from "./routes/contactRoutes.js";
import genreRouter from "./routes/genreRoutes.js";
import issueRouter from "./routes/issueRoutes.js";
import overviewRouter from "./routes/overviewRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import userRouter from "./routes/userRoutes.js";
import waitlistRouter from "./routes/waitlistRoutes.js";
import AppError from "./utils/appError.js";
import dbConnect from "./utils/dbConnect.js";

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log(err);

  process.exit(1);
});

dbConnect();

const app = express();

app.set("trust proxy", 1);
app.disable("x-powered-by");

// Security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit requests from same IP
const limiter = rateLimit({
  max: 300,
  windowMs: 60 * 60 * 1000,
  message: "Too many requests from this IP, please try again in an hour!",
});
app.use("/api", limiter);

const corsOptions = {
  origin: ["https://puthipallab.vercel.app", "http://localhost:5173"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// Body parser, cors, cookie parser
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// API Routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/books", bookRouter);
app.use("/api/v1/genres", genreRouter);
app.use("/api/v1/reviews", reviewRouter);
app.use("/api/v1/issues", issueRouter);
app.use("/api/v1/waitlist", waitlistRouter);
app.use("/api/v1/overview", overviewRouter);
app.use("/api/v1/contact", contactRouter);

// Home route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Puthi Pallab API",
  });
});

// 404 route
app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHander);

const port = 3000;
const server = app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log(err);

  server.close(() => {
    process.exit(1);
  });
});
