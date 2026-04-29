import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "revenue";

  if (type === "revenue") {
    const data = await query(
      `SELECT DATE_TRUNC('month', created_at) as period,
       COUNT(*) as transactions, SUM(amount) as total
       FROM payments GROUP BY period ORDER BY period DESC LIMIT 12`
    );
    return NextResponse.json({ data });
  }

  if (type === "utilisation") {
    const data = await query(
      `SELECT ca.id, ca.make, ca.model, ca.plate, ca.category,
       COUNT(r.id) as total_rentals,
       COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(r.actual_return, NOW()) - r.start_date))/86400), 0) as rented_days
       FROM cars ca LEFT JOIN rentals r ON r.car_id = ca.id
       GROUP BY ca.id ORDER BY rented_days DESC`
    );
    return NextResponse.json({ data });
  }

  if (type === "car_profit") {
    const data = await query(
      `SELECT ca.id, ca.make, ca.model, ca.plate,
       COALESCE(SUM(p.amount), 0) as revenue,
       COALESCE(SUM(m.cost), 0) as maintenance_cost,
       COALESCE(SUM(p.amount), 0) - COALESCE(SUM(m.cost), 0) as profit
       FROM cars ca
       LEFT JOIN rentals r ON r.car_id = ca.id
       LEFT JOIN payments p ON p.rental_id = r.id
       LEFT JOIN maintenance m ON m.car_id = ca.id
       GROUP BY ca.id ORDER BY profit DESC`
    );
    return NextResponse.json({ data });
  }

  if (type === "maintenance_cost") {
    const data = await query(
      `SELECT ca.make, ca.model, ca.plate,
       COUNT(m.id) as service_count, SUM(m.cost) as total_cost
       FROM maintenance m JOIN cars ca ON ca.id = m.car_id
       GROUP BY ca.id, ca.make, ca.model, ca.plate ORDER BY total_cost DESC`
    );
    return NextResponse.json({ data });
  }

  if (type === "pending_payments") {
    const data = await query(
      `SELECT r.id as rental_id, c.name as customer, ca.make, ca.model,
       r.total_amount, COALESCE(SUM(p.amount), 0) as paid,
       r.total_amount - COALESCE(SUM(p.amount), 0) as balance
       FROM rentals r
       LEFT JOIN customers c ON c.id = r.customer_id
       LEFT JOIN cars ca ON ca.id = r.car_id
       LEFT JOIN payments p ON p.rental_id = r.id
       GROUP BY r.id, c.name, ca.make, ca.model
       HAVING r.total_amount - COALESCE(SUM(p.amount), 0) > 0
       ORDER BY balance DESC`
    );
    return NextResponse.json({ data });
  }

  return NextResponse.json({ error: "Unknown report type" }, { status: 400 });
}
