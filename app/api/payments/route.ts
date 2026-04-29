import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const rentalId = searchParams.get("rental_id");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const method = searchParams.get("method");
  const search = searchParams.get("search");

  let sql = `SELECT p.*, c.name as customer_name, r.total_amount as rental_total
    FROM payments p
    LEFT JOIN customers c ON c.id = p.customer_id
    LEFT JOIN rentals r ON r.id = p.rental_id
    WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;

  if (status) {
    const statuses = status.split(",").map((s) => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      sql += ` AND p.status = $${i++}`; params.push(statuses[0]);
    } else if (statuses.length > 1) {
      const placeholders = statuses.map(() => `$${i++}`).join(", ");
      sql += ` AND p.status IN (${placeholders})`; params.push(...statuses);
    }
  }
  if (customerId) { sql += ` AND p.customer_id = $${i++}`; params.push(customerId); }
  if (rentalId) { sql += ` AND p.rental_id = $${i++}`; params.push(rentalId); }
  if (method) { sql += ` AND p.method = $${i++}`; params.push(method); }
  if (fromDate) { sql += ` AND p.created_at >= $${i++}`; params.push(fromDate); }
  if (toDate) { sql += ` AND p.created_at <= $${i++}`; params.push(toDate); }
  if (search) { sql += ` AND (c.name ILIKE $${i} OR c.email ILIKE $${i})`; params.push(`%${search}%`); i++; }

  sql += " ORDER BY p.created_at DESC";
  const payments = await query(sql, params);
  return NextResponse.json({ payments });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const { rental_id, customer_id, amount, method, notes } = body;
  if (!rental_id || !amount) return NextResponse.json({ error: "rental_id and amount required" }, { status: 400 });
  const result = await query(
    "INSERT INTO payments (rental_id, customer_id, amount, method, notes, created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *",
    [rental_id, customer_id, amount, method ?? "Cash", notes, session.sub]
  );
  await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)", [session.sub, session.name, `Recorded payment $${amount} for rental ${rental_id}`, "Payments", result[0].id]);
  return NextResponse.json({ payment: result[0] }, { status: 201 });
}
