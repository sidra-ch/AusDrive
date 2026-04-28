import { Router } from "express";
import { pool } from "../lib/prisma";

const router = Router();

router.get("/stats", async (_req, res) => {
  try {
    const [cars, activeRentals, bookings, revenue] = await Promise.all([
      pool.query("SELECT COUNT(*)::int AS count FROM cars"),
      pool.query("SELECT COUNT(*)::int AS count FROM rentals WHERE status = 'active'"),
      pool.query("SELECT COUNT(*)::int AS count FROM bookings"),
      pool.query("SELECT COALESCE(SUM(amount), 0)::float AS total FROM payments WHERE status = 'paid'"),
    ]);

    res.status(200).json({
      stats: {
        totalCars: cars.rows[0]?.count ?? 0,
        activeRentals: activeRentals.rows[0]?.count ?? 0,
        totalBookings: bookings.rows[0]?.count ?? 0,
        totalRevenue: revenue.rows[0]?.total ?? 0,
      },
    });
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    res.status(500).json({ error: "Failed to load dashboard stats" });
  }
});

export default router;
