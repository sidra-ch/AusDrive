import { Router } from "express";
import {
  getSessions,
  deleteSession,
  deleteAllSessions,
} from "../controllers/sessions.controller";
import { requireAuth } from "../middleware/auth.middleware";

const router = Router();

// All session routes require authentication
router.get("/", requireAuth, getSessions);
router.delete("/:sessionId", requireAuth, deleteSession);
router.delete("/", requireAuth, deleteAllSessions);

export default router;
