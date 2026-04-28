import { Router } from "express";
import { pool } from "../lib/prisma";

const router = Router();

router.get("/live", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        gl.car_id,
        c.make,
        c.model,
        c.plate,
        c.status AS car_status,
        gl.lat,
        gl.lng,
        gl.speed,
        gl.ignition,
        gl.fuel_level,
        gl.updated_at
      FROM gps_live gl
      LEFT JOIN cars c ON c.id = gl.car_id
      ORDER BY gl.updated_at DESC`
    );

    res.status(200).json({ tracking: result.rows });
  } catch (error) {
    console.error("GPS Live Error:", error);
    res.status(500).json({ error: "Failed to load tracking" });
  }
});

router.post("/live", async (req, res) => {
  try {
    const { carId, latitude, longitude, speed = 0 } = req.body || {};

    const id = Number(carId);
    const lat = Number(latitude);
    const lng = Number(longitude);
    const spd = Number(speed) || 0;

    if (!Number.isFinite(id) || !Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({ error: "carId, latitude and longitude are required" });
      return;
    }

    await pool.query(
      `INSERT INTO gps_live (car_id, lat, lng, speed, ignition, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW())
       ON CONFLICT (car_id)
       DO UPDATE SET lat = EXCLUDED.lat, lng = EXCLUDED.lng, speed = EXCLUDED.speed, ignition = true, updated_at = NOW()`,
      [id, lat, lng, spd]
    );

    await pool.query(
      `INSERT INTO gps_tracking (car_id, lat, lng, speed, recorded_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [id, lat, lng, spd]
    );

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error("GPS Update Error:", error);
    res.status(500).json({ error: "Failed to update position" });
  }
});

export default router;
