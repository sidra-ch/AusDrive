import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const customer = await queryOne("SELECT * FROM customers WHERE id = $1", [id]);
  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const rentals = await query(
    `SELECT r.*, ca.make, ca.model, ca.plate FROM rentals r
     LEFT JOIN cars ca ON ca.id = r.car_id WHERE r.customer_id = $1 ORDER BY r.created_at DESC LIMIT 10`, [id]
  );
  const payments = await query("SELECT * FROM payments WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 10", [id]);
  return NextResponse.json({ customer, rentals, payments });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const fields = Object.keys(body).filter((k) => k !== "id");
  const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const result = await query(
    `UPDATE customers SET ${sets}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...fields.map((f) => body[f]), id]
  );
  return NextResponse.json({ customer: result[0] });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await query("DELETE FROM customers WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
