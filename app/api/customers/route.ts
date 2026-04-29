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
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  let sql = `SELECT c.*, COUNT(r.id) as total_rentals FROM customers c LEFT JOIN rentals r ON r.customer_id = c.id WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;
  if (status) { sql += ` AND c.status = $${i++}`; params.push(status); }
  if (search) { sql += ` AND (c.name ILIKE $${i} OR c.email ILIKE $${i} OR c.phone ILIKE $${i})`; params.push(`%${search}%`); i++; }
  sql += " GROUP BY c.id ORDER BY c.created_at DESC";
  const customers = await query(sql, params);
  return handleCORS(NextResponse.json({ customers }), req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  const body = await req.json();
  const { name, email, phone, city, address, postcode, dob, licence_number, licence_state, licence_expiry, licence_class, notes } = body;
  if (!name || !email) return handleCORS(NextResponse.json({ error: "Name and email required" }, { status: 400 }), req.headers.get("origin") || undefined);
  const result = await query(
    `INSERT INTO customers (name, email, phone, city, address, postcode, dob, licence_number, licence_state, licence_expiry, licence_class, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [name, email, phone, city, address, postcode, dob || null, licence_number, licence_state, licence_expiry || null, licence_class ?? "C", notes]
  );
  await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)", [session.sub, session.name, `Added customer ${name}`, "Customers", result[0].id]);
  return handleCORS(NextResponse.json({ customer: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
}
