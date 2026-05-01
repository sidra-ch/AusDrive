import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const method = searchParams.get("method");
  const search = searchParams.get("search");

  // Schema detection
  const tables = await query<{ legacy_payments: string | null; prisma_payment: string | null }>(
    `SELECT to_regclass('public.payments') AS legacy_payments, to_regclass('public."Payment"') AS prisma_payment`
  );
  const schema = tables[0];

  try {
    if (schema?.legacy_payments) {
      let sql = `SELECT p.*, c.name as customer_name, r.total_amount as rental_total
        FROM payments p
        LEFT JOIN customers c ON c.id = p.customer_id
        LEFT JOIN rentals r ON r.id = p.rental_id
        WHERE 1=1`;
      const params: unknown[] = [];
      let i = 1;
      if (status) { sql += ` AND p.status = $${i++}`; params.push(status); }
      if (method) { sql += ` AND p.method = $${i++}`; params.push(method); }
      if (fromDate) { sql += ` AND p.created_at >= $${i++}`; params.push(fromDate); }
      if (toDate) { sql += ` AND p.created_at <= $${i++}`; params.push(toDate); }
      if (search) { sql += ` AND c.name ILIKE $${i++}`; params.push(`%${search}%`); }
      sql += " ORDER BY p.created_at DESC";
      const payments = await query(sql, params);
      return NextResponse.json({ payments });
    }

    if (schema?.prisma_payment) {
      let sql = `SELECT
        p.id::text AS id,
        p.amount,
        p.currency,
        p.status,
        p."paymentMethod" AS method,
        p."createdAt" AS created_at,
        b."totalPrice" AS rental_total,
        b."pickupDate" AS pickup_date,
        b."dropoffDate" AS dropoff_date,
        COALESCE(u.name, '') AS customer_name,
        u.email AS customer_email,
        ca.make AS car_make,
        ca.model AS car_model,
        ca.rego AS car_plate
      FROM "Payment" p
      LEFT JOIN "Booking" b ON b.id = p."bookingId"
      LEFT JOIN "User" u ON u.id = b."userId"
      LEFT JOIN "Car" ca ON ca.id = b."carId"
      WHERE 1=1`;
      const params: unknown[] = [];
      let i = 1;
      if (status) { sql += ` AND lower(p.status) = lower($${i++})`; params.push(status); }
      if (method) { sql += ` AND lower(p."paymentMethod") = lower($${i++})`; params.push(method); }
      if (fromDate) { sql += ` AND p."createdAt" >= $${i++}`; params.push(fromDate); }
      if (toDate) { sql += ` AND p."createdAt" <= $${i++}`; params.push(toDate); }
      if (search) { sql += ` AND (u.name ILIKE $${i} OR u.email ILIKE $${i})`; params.push(`%${search}%`); i++; }
      sql += ' ORDER BY p."createdAt" DESC';
      const payments = await query(sql, params);
      return NextResponse.json({ payments });
    }

    return NextResponse.json({ payments: [] });
  } catch (err) {
    console.error("[Payments GET]", err);
    return NextResponse.json({ error: "Failed to load payments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as Record<string, unknown>;
  const { booking_id, amount, method } = body as { booking_id?: string; amount?: number; method?: string };

  if (!booking_id || !amount) return NextResponse.json({ error: "booking_id and amount required" }, { status: 400 });

  const tables = await query<{ legacy_payments: string | null; prisma_payment: string | null }>(
    `SELECT to_regclass('public.payments') AS legacy_payments, to_regclass('public."Payment"') AS prisma_payment`
  );
  const schema = tables[0];

  try {
    if (schema?.prisma_payment) {
      const result = await query(
        `INSERT INTO "Payment" (id, "bookingId", amount, currency, status, "paymentMethod", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'AUD', 'paid', $3, NOW(), NOW())
         ON CONFLICT DO NOTHING
         RETURNING id::text AS id, amount, currency, status, "paymentMethod" AS method, "createdAt" AS created_at`,
        [booking_id, Number(amount), method ?? "card"]
      );
      return NextResponse.json({ payment: result[0] }, { status: 201 });
    }
    return NextResponse.json({ error: "No payments table" }, { status: 500 });
  } catch (err) {
    console.error("[Payments POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create payment" }, { status: 500 });
  }
}

