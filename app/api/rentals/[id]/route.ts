import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const rental = await queryOne(
    `SELECT r.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
     ca.make, ca.model, ca.plate, ca.category, ca.colour,
     COALESCE(SUM(p.amount), 0) as paid_amount,
     r.total_amount - COALESCE(SUM(p.amount), 0) as balance
     FROM rentals r
     LEFT JOIN customers c ON c.id = r.customer_id
     LEFT JOIN cars ca ON ca.id = r.car_id
     LEFT JOIN payments p ON p.rental_id = r.id
     WHERE r.id = $1 GROUP BY r.id, c.id, ca.id`, [id]
  );
  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const payments = await query("SELECT * FROM payments WHERE rental_id = $1 ORDER BY created_at DESC", [id]);
  return NextResponse.json({ rental, payments });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  // Handle return
  if (body.action === "return") {
    const { odometer_in, fuel_in, damage_notes, actual_return } = body;
    const rental = await queryOne<{ car_id: number; expected_return: string; daily_rate: number; total_amount: number; deposit: number }>(
      "SELECT * FROM rentals WHERE id = $1", [id]
    );
    if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const returnDate = new Date(actual_return ?? new Date());
    const expectedDate = new Date(rental.expected_return);
    const lateDays = Math.max(0, Math.ceil((returnDate.getTime() - expectedDate.getTime()) / 86400000));
    const lateFee = lateDays * 25;
    const finalAmount = parseFloat(String(rental.total_amount)) + lateFee;

    await query(
      `UPDATE rentals SET status = 'completed', actual_return = $1, odometer_in = $2,
       fuel_in = $3, damage_notes = $4, late_days = $5, total_amount = $6, updated_at = NOW()
       WHERE id = $7`,
      [returnDate, odometer_in, fuel_in, damage_notes, lateDays, finalAmount, id]
    );
    await query("UPDATE cars SET status = 'available' WHERE id = $1", [rental.car_id]);
    await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)",
      [session.sub, session.name, `Returned rental #${id} (${lateDays} late days)`, "Rentals", id]);
    return NextResponse.json({ success: true, lateDays, finalAmount });
  }

  // Generic update
  const fields = Object.keys(body).filter((k) => k !== "id" && k !== "action");
  if (!fields.length) return NextResponse.json({ error: "No fields" }, { status: 400 });
  const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
  const result = await query(
    `UPDATE rentals SET ${sets}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
    [...fields.map((f) => body[f]), id]
  );
  return NextResponse.json({ rental: result[0] });
}
