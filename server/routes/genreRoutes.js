import { Router } from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  addGenre,
  deleteGenre,
  getAllGenres,
  updateGenre,
} from "../controllers/genreController.js";

const router = Router();

router
  .route("/")
  .post(protect, restrictTo("librarian"), addGenre)
  .get(getAllGenres);

router
  .route("/:id")
  .patch(protect, restrictTo("librarian"), updateGenre)
  .delete(protect, restrictTo("librarian"), deleteGenre);

export default router;
