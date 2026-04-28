import { Router } from "express";
import { pool } from "../lib/prisma";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        b.id,
        COALESCE(cu.name, 'Unknown Customer') AS customer_name,
        COALESCE(c.make, '') AS car_make,
        COALESCE(c.model, '') AS car_model,
        b.pickup_date,
        b.return_date,
        b.status,
        NULL::numeric AS total_amount
      FROM bookings b
      LEFT JOIN customers cu ON cu.id = b.customer_id
      LEFT JOIN cars c ON c.id = b.car_id
      ORDER BY b.created_at DESC
      LIMIT 200`
    );

    res.status(200).json({ bookings: result.rows });
  } catch (error) {
    console.error("Bookings Error:", error);
    res.status(500).json({ error: "Failed to load bookings" });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      pickup_date,
      return_date,
      pickup_location,
      status = "pending",
      car_id,
      customer_id,
    } = req.body || {};

    if (!pickup_date || !return_date) {
      res.status(400).json({ error: "pickup_date and return_date are required" });
      return;
    }

    const result = await pool.query(
      `INSERT INTO bookings (customer_id, car_id, pickup_date, return_date, pickup_location, status, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING id, pickup_date, return_date, pickup_location, status`,
      [
        Number.isFinite(Number(customer_id)) ? Number(customer_id) : null,
        Number.isFinite(Number(car_id)) ? Number(car_id) : null,
        pickup_date,
        return_date,
        pickup_location || null,
        status,
      ]
    );

    res.status(201).json({ booking: result.rows[0] });
  } catch (error) {
    console.error("Create Booking Error:", error);
    res.status(500).json({ error: "Failed to create booking" });
  }
});

export default router;
