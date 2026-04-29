import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const carId = searchParams.get("car_id");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const search = searchParams.get("search");

  let sql = `SELECT r.*, 
    c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
    ca.make, ca.model, ca.plate, ca.category,
    COALESCE(SUM(p.amount), 0) as paid_amount,
    r.total_amount - COALESCE(SUM(p.amount), 0) as balance
    FROM rentals r
    LEFT JOIN customers c ON c.id = r.customer_id
    LEFT JOIN cars ca ON ca.id = r.car_id
    LEFT JOIN payments p ON p.rental_id = r.id
    WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;

  if (status) { sql += ` AND r.status = $${i++}`; params.push(status); }
  if (customerId) { sql += ` AND r.customer_id = $${i++}`; params.push(customerId); }
  if (carId) { sql += ` AND r.car_id = $${i++}`; params.push(carId); }
  if (fromDate) { sql += ` AND r.start_date >= $${i++}`; params.push(fromDate); }
  if (toDate) { sql += ` AND r.start_date <= $${i++}`; params.push(toDate); }
  if (search) { sql += ` AND (c.name ILIKE $${i++} OR ca.plate ILIKE $${i})`; params.push(`%${search}%`, `%${search}%`); i++; }

  sql += " GROUP BY r.id, c.id, ca.id ORDER BY r.created_at DESC";
  const rentals = await query(sql, params);
  return handleCORS(NextResponse.json({ rentals }), req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  const body = await req.json();
  const { customer_id, car_id, start_date, expected_return, daily_rate, deposit, discount, late_fee_per_day, odometer_out, fuel_out } = body;
  if (!customer_id || !car_id || !start_date || !expected_return)
    return handleCORS(NextResponse.json({ error: "Required fields missing" }, { status: 400 }), req.headers.get("origin") || undefined);

  const days = Math.ceil((new Date(expected_return).getTime() - new Date(start_date).getTime()) / 86400000);
  const total = (daily_rate * days) - (discount ?? 0) + (deposit ?? 0);

  const result = await query(
    `INSERT INTO rentals (customer_id, car_id, start_date, expected_return, daily_rate, deposit, discount, late_fee_per_day, total_amount, odometer_out, fuel_out, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [customer_id, car_id, start_date, expected_return, daily_rate, deposit ?? 500, discount ?? 0, late_fee_per_day ?? 25, total, odometer_out, fuel_out ?? 100, session.sub]
  );

  await query("UPDATE cars SET status = 'rented' WHERE id = $1", [car_id]);
  await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)", [session.sub, session.name, `Created rental for car ${car_id}`, "Rentals", result[0].id]);
  return handleCORS(NextResponse.json({ rental: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
}
