import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession, verifyToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

async function getSessionFromRequest(req: NextRequest) {
  let session = await getSession();
  if (!session) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      session = await verifyToken(authHeader.slice(7));
    }
  }
  return session;
}

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  // Non-admin users only see their own bookings (keyed by user id in customer table)
  const isAdmin = ["ADMIN", "STAFF", "SUPER_ADMIN"].includes(session.role);
  let sql = `SELECT b.*, c.name as customer_name, c.email as customer_email,
    ca.make, ca.model, ca.plate
    FROM bookings b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN cars ca ON ca.id = b.car_id
    WHERE 1=1`;
  const params: unknown[] = [];
  let paramIdx = 1;
  if (!isAdmin) {
    sql += ` AND b.created_by = $${paramIdx++}`;
    params.push(session.sub);
  }
  if (status) { sql += ` AND b.status = $${paramIdx++}`; params.push(status); }
  sql += " ORDER BY b.created_at DESC";
  const bookings = await query(sql, params);
  return handleCORS(NextResponse.json({ bookings }), req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  const session = await getSessionFromRequest(req);
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), origin);
  const body = await req.json();
  const { customer_id, car_id, pickup_date, return_date, pickup_location, notes, payment_method } = body;

  if (!car_id || !pickup_date || !return_date)
    return handleCORS(NextResponse.json({ error: "car_id, pickup_date and return_date are required" }, { status: 400 }), origin);

  // For admin-created bookings a customer_id is required; for self-service it is optional
  const isAdmin = ["ADMIN", "STAFF", "SUPER_ADMIN"].includes(session.role);
  if (isAdmin && !customer_id)
    return handleCORS(NextResponse.json({ error: "customer_id is required" }, { status: 400 }), origin);

  // Validate date range
  const pickup = new Date(pickup_date);
  const returnD = new Date(return_date);
  if (isNaN(pickup.getTime()) || isNaN(returnD.getTime()) || returnD <= pickup)
    return handleCORS(NextResponse.json({ error: "Invalid date range" }, { status: 400 }), origin);

  // Conflict check — block overlapping bookings for the same car
  const conflict = await query(
    `SELECT id FROM bookings WHERE car_id = $1 AND status NOT IN ('CANCELLED', 'cancelled')
     AND (pickup_date, return_date) OVERLAPS ($2::timestamptz, $3::timestamptz)`,
    [car_id, pickup_date, return_date]
  );
  if (conflict.length > 0)
    return handleCORS(NextResponse.json({ error: "Car already booked for this period" }, { status: 409 }), origin);

  // Determine initial status:
  // - cash payments require admin confirmation → PENDING
  // - card payments are also PENDING until webhook confirms
  const initialStatus = "PENDING";

  const effectiveCustomerId = customer_id ?? null;
  const result = await query(
    `INSERT INTO bookings (customer_id, car_id, pickup_date, return_date, pickup_location, notes, status, payment_method, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [effectiveCustomerId, car_id, pickup_date, return_date, pickup_location ?? null, notes ?? null, initialStatus, payment_method ?? "card", session.sub]
  );

  await query(
    "INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)",
    [session.sub, session.name, `Created booking for car ${car_id}`, "Bookings", result[0].id]
  ).catch(() => {}); // audit log failure should not fail the booking

  return handleCORS(NextResponse.json({ booking: result[0] }, { status: 201 }), origin);
}
