import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const rentalId = searchParams.get("rental_id");
  const customerId = searchParams.get("customer_id");

  let sql = `SELECT i.*, r.id as rental_id, c.name as customer_name, c.email, c.phone 
    FROM invoices i
    LEFT JOIN rentals r ON r.id = i.rental_id
    LEFT JOIN customers c ON c.id = i.customer_id
    WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;

  if (rentalId) {
    sql += ` AND i.rental_id = $${i++}`;
    params.push(rentalId);
  }
  if (customerId) {
    sql += ` AND i.customer_id = $${i++}`;
    params.push(customerId);
  }

  sql += " ORDER BY i.created_at DESC";

  const invoices = await query(sql, params);
  return NextResponse.json({ invoices });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rentalId, customerId, items, dueDate, notes } = await req.json();

  if (!rentalId || !customerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Calculate total
  const total = items.reduce((sum: number, item: {amount: number}) => sum + item.amount, 0);

  // Create invoice
  const result = await query(
    `INSERT INTO invoices (rental_id, customer_id, total_amount, due_date, notes, status) 
    VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [rentalId, customerId, total, dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), notes, "pending"]
  );

  const invoice = result[0];

  // Insert line items
  for (const item of items) {
    await query(
      `INSERT INTO invoice_items (invoice_id, description, amount, quantity) 
      VALUES ($1,$2,$3,$4)`,
      [invoice.id, item.description, item.amount, item.quantity || 1]
    );
  }

  return NextResponse.json({ invoice }, { status: 201 });
}
