import { Router } from "express";
import { protect, restrictTo } from "../controllers/authController.js";
import {
  getMemberOverview,
  getOverview,
} from "../controllers/overviewController.js";

const router = Router();

router.route("/").get(protect, restrictTo("librarian"), getOverview);
router.route("/me").get(protect, restrictTo("member"), getMemberOverview);

export default router;
