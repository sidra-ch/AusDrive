import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
} from "../controllers/users.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// All user routes require authentication
router.get("/profile", requireAuth, getProfile);
router.put("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);
router.delete("/account", requireAuth, deleteAccount);

export default router;
