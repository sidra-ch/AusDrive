import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const car = await queryOne("SELECT * FROM cars WHERE id = $1", [id]);
  if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const rentals = await query("SELECT r.*, c.name as customer_name FROM rentals r LEFT JOIN customers c ON c.id = r.customer_id WHERE r.car_id = $1 ORDER BY r.created_at DESC LIMIT 10", [id]);
  const maintenance = await query("SELECT * FROM maintenance WHERE car_id = $1 ORDER BY service_date DESC LIMIT 10", [id]);
  const gps = await queryOne("SELECT * FROM gps_live WHERE car_id = $1", [id]);
  return NextResponse.json({ car, rentals, maintenance, gps });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const fields = Object.keys(body).filter((k) => k !== "id");
  if (!fields.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const values = fields.map((f) => body[f]);
  const result = await query(`UPDATE cars SET ${sets}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`, [...values, id]);
  if (!result[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)", [session.sub, session.name, `Updated car ID ${id}`, "Cars", id]);
  return NextResponse.json({ car: result[0] });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await query("DELETE FROM cars WHERE id = $1", [id]);
  await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)", [session.sub, session.name, `Deleted car ID ${id}`, "Cars", id]);
  return NextResponse.json({ success: true });
}
