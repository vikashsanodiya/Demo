import { Router } from "express";
import {
  forgotPassword,
  login,
  logout,
  protect,
  resendVerificationEmail,
  resetPassword,
  restrictTo,
  signup,
  updatePassword,
  verifyEmail,
} from "../controllers/authController.js";
import {
  getAllUsers,
  getMe,
  updateMe,
  updateUserRole,
} from "../controllers/userController.js";

const router = Router();

router.get("/me", protect, getMe);

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

router.patch("/verifyEmail/:token", verifyEmail);
router.post("/resendVerificationEmail", resendVerificationEmail);

router.post("/forgotPassword", forgotPassword);
router.patch("/resetPassword/:token", resetPassword);

router.patch("/updateMyPassword", protect, updatePassword);
router.patch("/updateMe", protect, updateMe);

router.patch("/roles/:id", protect, restrictTo("librarian"), updateUserRole);

router.route("/").get(protect, restrictTo("librarian"), getAllUsers);

export default router;
