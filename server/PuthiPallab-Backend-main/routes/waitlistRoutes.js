import { Router } from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  addToWaitlist,
  getAllWaitlist,
  getMyWaitlist,
  removeFromWaitlist,
} from "../controllers/waitlistController.js";

const router = Router();

router.get("/myWaitlist", protect, getMyWaitlist);

router
  .route("/")
  .get(protect, restrictTo("librarian"), getAllWaitlist)
  .post(protect, restrictTo("member"), addToWaitlist)
  .patch(protect, restrictTo("member"), removeFromWaitlist);

router
  .route("/:id")
  .patch(protect, restrictTo("librarian"), removeFromWaitlist);

export default router;
