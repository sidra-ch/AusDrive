import { Router } from "express";
import { pool } from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        id,
        make,
        model,
        plate,
        year,
        status,
        daily_rate::text AS daily_rate,
        category,
        colour,
        image_url
      FROM cars
      ORDER BY created_at DESC
      LIMIT 200`
    );

    res.status(200).json({ cars: result.rows });
  } catch (error) {
    console.error("Cars Error:", error);
    res.status(500).json({ error: "Failed to load cars" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) {
      res.status(400).json({ error: "Invalid car id" });
      return;
    }

    const result = await pool.query(
      `SELECT
        id,
        make,
        model,
        plate,
        year,
        status,
        daily_rate::text AS daily_rate,
        category,
        colour,
        image_url,
        seats,
        transmission,
        fuel_type,
        city,
        branch,
        notes
      FROM cars
      WHERE id = $1
      LIMIT 1`,
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: "Car not found" });
      return;
    }

    res.status(200).json({ car: result.rows[0] });
  } catch (error) {
    console.error("Car Detail Error:", error);
    res.status(500).json({ error: "Failed to load car" });
  }
});

export default router;
