import { Router } from "express";
import { pool } from "../lib/prisma";

const router = Router();

router.get("/recommendations", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        make,
        model,
        category,
        ('$' || COALESCE(daily_rate::text, '0')) AS daily_rate,
        COALESCE(image_url, '') AS image_url
      FROM cars
      WHERE status = 'available'
      ORDER BY daily_rate ASC
      LIMIT 8`
    );

    const recommendations = result.rows.map((row) => ({
      ...row,
      ai_reason: "Great value based on current availability",
    }));

    res.status(200).json({ recommendations });
  } catch (error) {
    console.error("AI Recommendations Error:", error);
    res.status(500).json({ error: "Failed to load recommendations" });
  }
});

export default router;
