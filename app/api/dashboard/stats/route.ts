import { NextRequest, NextResponse } from "next/server";
import { queryOne, query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

  const [
    totalCars, availableCars, rentedCars, maintenanceCars,
    totalCustomers, activeRentals, overdueRentals,
    todayRevenue, monthRevenue, totalRevenue,
    dueToday, recentRentals, pendingPayments, pageViews
  ] = await Promise.all([
    queryOne<{ count: string }>("SELECT COUNT(*) FROM cars"),
    queryOne<{ count: string }>("SELECT COUNT(*) FROM cars WHERE status = 'available'"),
    queryOne<{ count: string }>("SELECT COUNT(*) FROM cars WHERE status = 'rented'"),
    queryOne<{ count: string }>("SELECT COUNT(*) FROM cars WHERE status = 'maintenance'"),
    queryOne<{ count: string }>("SELECT COUNT(*) FROM customers WHERE status = 'active'"),
    queryOne<{ count: string }>("SELECT COUNT(*) FROM rentals WHERE status = 'active'"),
    queryOne<{ count: string }>("SELECT COUNT(*) FROM rentals WHERE status = 'overdue'"),
    queryOne<{ sum: string }>("SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE DATE(created_at) = CURRENT_DATE"),
    queryOne<{ sum: string }>("SELECT COALESCE(SUM(amount), 0) as sum FROM payments WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())"),
    queryOne<{ sum: string }>("SELECT COALESCE(SUM(amount), 0) as sum FROM payments"),
    queryOne<{ count: string }>("SELECT COUNT(*) FROM rentals WHERE DATE(expected_return) = CURRENT_DATE AND status = 'active'"),
    query(`SELECT r.id, r.status, r.total_amount, r.start_date, r.expected_return,
      c.name as customer_name, ca.make, ca.model, ca.plate
      FROM rentals r
      LEFT JOIN customers c ON c.id = r.customer_id
      LEFT JOIN cars ca ON ca.id = r.car_id
      ORDER BY r.created_at DESC LIMIT 5`),
    query(`SELECT p.*, c.name as customer_name FROM payments p
      LEFT JOIN customers c ON c.id = p.customer_id
      WHERE p.status != 'paid' ORDER BY p.created_at DESC LIMIT 5`),
    queryOne<{ count: string }>("SELECT COUNT(*) FROM page_views WHERE DATE(created_at) = CURRENT_DATE"),
  ]);

  // Revenue chart (last 6 months)
  const revenueChart = await query<{ month: string; revenue: string }>(
    `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as month,
     COALESCE(SUM(amount), 0) as revenue
     FROM payments
     WHERE created_at >= NOW() - INTERVAL '6 months'
     GROUP BY DATE_TRUNC('month', created_at)
     ORDER BY DATE_TRUNC('month', created_at)`
  );

  return handleCORS(NextResponse.json({
    kpis: {
      totalCars: parseInt(totalCars?.count ?? "0"),
      availableCars: parseInt(availableCars?.count ?? "0"),
      rentedCars: parseInt(rentedCars?.count ?? "0"),
      maintenanceCars: parseInt(maintenanceCars?.count ?? "0"),
      totalCustomers: parseInt(totalCustomers?.count ?? "0"),
      activeRentals: parseInt(activeRentals?.count ?? "0"),
      overdueRentals: parseInt(overdueRentals?.count ?? "0"),
      dueToday: parseInt(dueToday?.count ?? "0"),
      todayRevenue: parseFloat(todayRevenue?.sum ?? "0"),
      monthRevenue: parseFloat(monthRevenue?.sum ?? "0"),
      totalRevenue: parseFloat(totalRevenue?.sum ?? "0"),
      todayViews: parseInt(pageViews?.count ?? "0"),
    },
    recentRentals,
    pendingPayments,
    revenueChart,
  }), req.headers.get("origin") || undefined);
}
