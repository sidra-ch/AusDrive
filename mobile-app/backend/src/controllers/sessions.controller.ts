import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isActive: true,
      },
      select: {
        id: true,
        deviceName: true,
        deviceType: true,
        ipAddress: true,
        lastActivityAt: true,
        createdAt: true,
      },
      orderBy: {
        lastActivityAt: "desc",
      },
    });

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

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    if (session.userId !== userId) {
      res.status(403).json({ error: "Forbidden" });
      return;
    }

    await prisma.session.update({
      where: { id: sessionId },
      data: { isActive: false },
    });

    res.status(200).json({ message: "Session terminated successfully" });
  } catch (error) {
    console.error("Delete Session Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAllSessions = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    await prisma.session.updateMany({
      where: {
        userId,
        isActive: true,
      },
      data: { isActive: false },
    });

    res.status(200).json({ message: "All sessions terminated successfully" });
  } catch (error) {
    console.error("Delete All Sessions Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
