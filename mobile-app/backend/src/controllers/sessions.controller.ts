import { Request, Response } from "express";
import { pool } from "../lib/prisma";
import { ensureBackendSchema } from "../lib/schema";

export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureBackendSchema();

    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const result = await pool.query(
      `SELECT id, device_name, device_type, ip_address, last_activity_at, created_at
       FROM user_sessions
       WHERE user_id = $1 AND is_active = TRUE
       ORDER BY last_activity_at DESC`,
      [Number(userId)]
    );

    const sessions = result.rows.map((row) => ({
      id: row.id,
      deviceName: row.device_name,
      deviceType: row.device_type,
      ipAddress: row.ip_address,
      lastActivityAt: row.last_activity_at,
      createdAt: row.created_at,
    }));

    res.status(200).json({
      sessions,
      total: sessions.length,
    });
  } catch (error) {
    console.error("Get Sessions Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteSession = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureBackendSchema();

    const userId = (req as any).userId;
    const sessionId = Array.isArray(req.params.sessionId)
      ? req.params.sessionId[0]
      : req.params.sessionId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    if (!sessionId) {
      res.status(400).json({ error: "Session ID is required" });
      return;
    }

    const sessionResult = await pool.query(
      `SELECT id, user_id FROM user_sessions WHERE id = $1 LIMIT 1`,
      [Number(sessionId)]
    );
    const session = sessionResult.rows[0];

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (Number(session.user_id) !== Number(userId)) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await pool.query(
      `UPDATE user_sessions SET is_active = FALSE WHERE id = $1`,
      [Number(sessionId)]
    );

    res.status(200).json({ message: "Session terminated successfully" });
  } catch (error) {
    console.error("Delete Session Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAllSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    await ensureBackendSchema();

    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await pool.query(
      `UPDATE user_sessions SET is_active = FALSE WHERE user_id = $1 AND is_active = TRUE`,
      [Number(userId)]
    );

    res.status(200).json({ message: "All sessions terminated successfully" });
  } catch (error) {
    console.error("Delete All Sessions Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
