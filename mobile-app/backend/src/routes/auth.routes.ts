import { Router } from "express";
import {
  register,
  login,
  verifyEmail,
  googleLogin,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);
// Apple login can be added similarly: router.post("/apple", appleLogin);
router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Protected routes
router.get("/me", requireAuth, getMe);

export default router;
