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
  let sql = `SELECT b.*, c.name as customer_name, c.email as customer_email,
    ca.make, ca.model, ca.plate
    FROM bookings b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN cars ca ON ca.id = b.car_id
    WHERE 1=1`;
  const params: unknown[] = [];
  if (status) { sql += ` AND b.status = $1`; params.push(status); }
  sql += " ORDER BY b.created_at DESC";
  const bookings = await query(sql, params);
  return handleCORS(NextResponse.json({ bookings }), req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  const body = await req.json();
  const { customer_id, car_id, pickup_date, return_date, pickup_location, notes } = body;
  if (!customer_id || !car_id || !pickup_date || !return_date)
    return handleCORS(NextResponse.json({ error: "Required fields missing" }, { status: 400 }), req.headers.get("origin") || undefined);

  // Conflict check
  const conflict = await query(
    `SELECT id FROM bookings WHERE car_id = $1 AND status NOT IN ('cancelled')
     AND (pickup_date, return_date) OVERLAPS ($2::timestamptz, $3::timestamptz)`,
    [car_id, pickup_date, return_date]
  );
  if (conflict.length > 0)
    return handleCORS(NextResponse.json({ error: "Car already booked for this period" }, { status: 409 }), req.headers.get("origin") || undefined);

  const result = await query(
    `INSERT INTO bookings (customer_id, car_id, pickup_date, return_date, pickup_location, notes, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [customer_id, car_id, pickup_date, return_date, pickup_location, notes, session.sub]
  );
  await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)",
    [session.sub, session.name, `Created booking for car ${car_id}`, "Bookings", result[0].id]);
  return handleCORS(NextResponse.json({ booking: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
}
