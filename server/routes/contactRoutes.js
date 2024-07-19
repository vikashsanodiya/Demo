import { Router } from "express";
import { sendMessage } from "../controllers/contactController.js";

const router = Router();

router.route("/").post(sendMessage);

export default router;
