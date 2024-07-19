import { Router } from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  addBook,
  addMultipleBooks,
  deleteBook,
  getAllBooks,
  getBook,
  updateBook,
} from "../controllers/bookController.js";

const router = Router();

router
  .route("/multiple")
  .post(protect, restrictTo("librarian"), addMultipleBooks);

router
  .route("/")
  .get(getAllBooks)
  .post(protect, restrictTo("librarian"), addBook);

router
  .route("/:id")
  .get(getBook)
  .patch(protect, restrictTo("librarian"), updateBook)
  .delete(protect, restrictTo("librarian"), deleteBook);

export default router;
