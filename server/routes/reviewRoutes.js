import { Router } from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  addReview,
  deleteReview,
  getAllReviews,
  getBookReviews,
  getMyReviews,
  updateReview,
} from "../controllers/reviewController.js";

const router = Router();

router.route("/myReviews").get(protect, restrictTo("member"), getMyReviews);

router
  .route("/")
  .get(protect, restrictTo("librarian"), getAllReviews)
  .post(protect, restrictTo("member"), addReview);

router
  .route("/:id")
  .get(getBookReviews)
  .patch(protect, restrictTo("member"), updateReview)
  .delete(protect, restrictTo("member", "librarian"), deleteReview);

export default router;
