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
  const carId = searchParams.get("car_id");
  const type = searchParams.get("type");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const search = searchParams.get("search");

  let sql = `SELECT m.*, c.make, c.model, c.plate FROM maintenance m
     LEFT JOIN cars c ON c.id = m.car_id WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;

  if (status) { sql += ` AND m.status = $${i++}`; params.push(status); }
  if (carId) { sql += ` AND m.car_id = $${i++}`; params.push(carId); }
  if (type) { sql += ` AND m.type = $${i++}`; params.push(type); }
  if (fromDate) { sql += ` AND m.service_date >= $${i++}`; params.push(fromDate); }
  if (toDate) { sql += ` AND m.service_date <= $${i++}`; params.push(toDate); }
  if (search) { sql += ` AND (c.plate ILIKE $${i} OR m.provider ILIKE $${i})`; params.push(`%${search}%`); i++; }

  sql += " ORDER BY m.service_date DESC";
  const records = await query(sql, params);
  return handleCORS(NextResponse.json({ maintenance: records }), req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  const body = await req.json();
  const { car_id, type, description, cost, service_date, next_service_km, odometer, status, provider } = body;
  if (!car_id || !type || !service_date) return handleCORS(NextResponse.json({ error: "Required fields missing" }, { status: 400 }), req.headers.get("origin") || undefined);
  const result = await query(
    `INSERT INTO maintenance (car_id, type, description, cost, service_date, next_service_km, odometer, status, provider, created_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [car_id, type, description, cost ?? 0, service_date, next_service_km, odometer, status ?? "scheduled", provider, session.sub]
  );
  if (status === "in_progress") await query("UPDATE cars SET status = 'maintenance' WHERE id = $1", [car_id]);
  await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)", [session.sub, session.name, `Added maintenance record for car ${car_id}`, "Maintenance", result[0].id]);
  return handleCORS(NextResponse.json({ record: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
}
