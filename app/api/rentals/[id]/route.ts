import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

async function detectSchema() {
  const rows = await query<{
    legacy_rentals: string | null;
    legacy_payments: string | null;
    legacy_cars: string | null;
    legacy_customers: string | null;
    prisma_booking: string | null;
    prisma_payment: string | null;
    prisma_car: string | null;
    prisma_user: string | null;
    booking_user_id: boolean;
    booking_car_id: boolean;
    booking_customer_name: boolean;
    booking_customer_email: boolean;
    booking_customer_phone: boolean;
    booking_pickup_date: boolean;
    booking_dropoff_date: boolean;
    booking_total_amount: boolean;
    booking_total_price: boolean;
    booking_status: boolean;
    booking_created_at: boolean;
    booking_actual_return: boolean;
    booking_odometer_in: boolean;
    booking_fuel_in: boolean;
    booking_damage_notes: boolean;
    booking_late_days: boolean;
    booking_updated_at: boolean;
    car_plate_number: boolean;
    car_plate: boolean;
    car_rego: boolean;
    car_category: boolean;
    car_status: boolean;
    payment_booking_id: boolean;
    payment_created_at: boolean;
  }>(`SELECT
    to_regclass('public.rentals') AS legacy_rentals,
    to_regclass('public.payments') AS legacy_payments,
    to_regclass('public.cars') AS legacy_cars,
    to_regclass('public.customers') AS legacy_customers,
    to_regclass('public."Booking"') AS prisma_booking,
    to_regclass('public."Payment"') AS prisma_payment,
    to_regclass('public."Car"') AS prisma_car,
    to_regclass('public."User"') AS prisma_user,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='userId') AS booking_user_id,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='carId') AS booking_car_id,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='customerName') AS booking_customer_name,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='customerEmail') AS booking_customer_email,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='customerPhone') AS booking_customer_phone,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='pickupDate') AS booking_pickup_date,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='dropoffDate') AS booking_dropoff_date,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='totalAmount') AS booking_total_amount,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='totalPrice') AS booking_total_price,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='status') AS booking_status,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='createdAt') AS booking_created_at,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='actualReturn') AS booking_actual_return,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='odometerIn') AS booking_odometer_in,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='fuelIn') AS booking_fuel_in,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='damageNotes') AS booking_damage_notes,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='lateDays') AS booking_late_days,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='updatedAt') AS booking_updated_at,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='plateNumber') AS car_plate_number,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='plate') AS car_plate,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='rego') AS car_rego,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='category') AS car_category,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='status') AS car_status,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Payment' AND column_name='bookingId') AS payment_booking_id,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Payment' AND column_name='createdAt') AS payment_created_at`);

  return rows[0];
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const schema = await detectSchema();
  const usePrisma = Boolean(schema?.prisma_booking);
  const useLegacy = !usePrisma && Boolean(schema?.legacy_rentals);

  if (!usePrisma && !useLegacy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const canJoinUser = Boolean(schema?.prisma_user && schema?.booking_user_id);
  const canJoinCar = Boolean(schema?.prisma_car && schema?.booking_car_id);
  const canJoinPayment = Boolean(schema?.prisma_payment && schema?.payment_booking_id);
  const plateExpr = schema?.car_plate_number ? 'ca."plateNumber"' : schema?.car_plate ? "ca.plate" : schema?.car_rego ? "ca.rego" : "NULL::text";
  const customerNameExpr = schema?.booking_customer_name
    ? 'b."customerName"'
    : canJoinUser
    ? 'u.name'
    : schema?.booking_customer_email
    ? 'b."customerEmail"'
    : "NULL::text";
  const customerEmailExpr = schema?.booking_customer_email
    ? 'b."customerEmail"'
    : canJoinUser
    ? 'u.email'
    : "NULL::text";
  const customerPhoneExpr = schema?.booking_customer_phone
    ? 'b."customerPhone"'
    : canJoinUser
    ? 'u.phone'
    : "NULL::text";
  const startDateExpr = schema?.booking_pickup_date ? 'b."pickupDate"' : "NULL::timestamptz";
  const expectedReturnExpr = schema?.booking_dropoff_date ? 'b."dropoffDate"' : "NULL::timestamptz";
  const totalAmountExpr = schema?.booking_total_amount ? 'b."totalAmount"' : schema?.booking_total_price ? 'b."totalPrice"' : "0::numeric";
  const statusExpr = schema?.booking_status ? "lower(b.status::text)" : "'pending'::text";
  const createdAtExpr = schema?.booking_created_at ? 'b."createdAt"' : "NOW()";

  const rental = useLegacy
    ? await queryOne(
        `SELECT r.*, c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
         ca.make, ca.model, ca.plate, ca.category, ca.colour,
         COALESCE(SUM(p.amount), 0) as paid_amount,
         r.total_amount - COALESCE(SUM(p.amount), 0) as balance
         FROM rentals r
         LEFT JOIN customers c ON c.id = r.customer_id
         LEFT JOIN cars ca ON ca.id = r.car_id
         LEFT JOIN payments p ON p.rental_id = r.id
         WHERE r.id = $1 GROUP BY r.id, c.id, ca.id`,
        [id]
      )
    : await queryOne(
        `SELECT
          b.id::text AS id,
          ${customerNameExpr} AS customer_name,
          ${customerEmailExpr} AS customer_email,
          ${customerPhoneExpr} AS customer_phone,
          ca.make,
          ca.model,
          ${plateExpr} AS plate,
          ${schema?.car_category ? "initcap(replace(ca.category::text, '_', ' '))" : "NULL::text"} AS category,
          ${startDateExpr} AS start_date,
          ${expectedReturnExpr} AS expected_return,
          ${schema?.booking_actual_return ? 'b."actualReturn"' : "NULL::timestamptz"} AS actual_return,
          ${totalAmountExpr} AS total_amount,
          ${statusExpr} AS status,
          ${schema?.booking_odometer_in ? 'b."odometerIn"' : "NULL::int"} AS odometer_in,
          ${schema?.booking_fuel_in ? 'b."fuelIn"' : "NULL::int"} AS fuel_in,
          ${schema?.booking_damage_notes ? 'b."damageNotes"' : "NULL::text"} AS damage_notes,
          ${schema?.booking_late_days ? 'b."lateDays"' : "0::int"} AS late_days,
          0::numeric AS daily_rate,
          0::numeric AS deposit,
          0::numeric AS discount,
          COALESCE(SUM(p.amount), 0) AS paid_amount,
          ${totalAmountExpr} - COALESCE(SUM(p.amount), 0) AS balance,
          ${createdAtExpr} AS created_at,
          ${schema?.booking_user_id ? 'b."userId"' : "NULL::text"} AS customer_id,
          ${schema?.booking_car_id ? 'b."carId"' : "NULL::text"} AS car_id
          FROM "Booking" b
          ${canJoinUser ? 'LEFT JOIN "User" u ON u.id = b."userId"' : ""}
          ${canJoinCar ? 'LEFT JOIN "Car" ca ON ca.id = b."carId"' : 'LEFT JOIN LATERAL (SELECT NULL::text AS make, NULL::text AS model, NULL::text AS plate, NULL::text AS category) ca ON true'}
          ${canJoinPayment ? 'LEFT JOIN "Payment" p ON p."bookingId" = b.id' : ""}
          WHERE b.id = $1
          GROUP BY b.id, ${customerNameExpr}, ${customerEmailExpr}, ${customerPhoneExpr}, ca.make, ca.model, ${plateExpr}, ${schema?.car_category ? "ca.category" : "NULL::text"}, ${startDateExpr}, ${expectedReturnExpr}, ${totalAmountExpr}, ${statusExpr}, ${createdAtExpr}`,
        [id]
      );

  if (!rental) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const payments = useLegacy
    ? await query("SELECT * FROM payments WHERE rental_id = $1 ORDER BY created_at DESC", [id])
    : schema?.prisma_payment && schema?.payment_booking_id
    ? await query(
        `SELECT id, amount, method, status,
         ${schema?.payment_created_at ? '"createdAt"' : "NOW()"} AS created_at
         FROM "Payment"
         WHERE "bookingId" = $1
         ORDER BY ${schema?.payment_created_at ? '"createdAt"' : "NOW()"} DESC`,
        [id]
      )
    : [];

  return NextResponse.json({ rental, payments });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const schema = await detectSchema();
  const usePrisma = Boolean(schema?.prisma_booking);
  const useLegacy = !usePrisma && Boolean(schema?.legacy_rentals);

  if (!usePrisma && !useLegacy) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Handle return
  if (body.action === "return") {
    const { odometer_in, fuel_in, damage_notes, actual_return } = body;
    if (useLegacy) {
      const rental = await queryOne<{ car_id: number; expected_return: string; total_amount: number }>(
        "SELECT * FROM rentals WHERE id = $1",
        [id]
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
      if (schema?.legacy_cars) {
        await query("UPDATE cars SET status = 'available' WHERE id = $1", [rental.car_id]);
      }
      await query(
        "INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)",
        [session.sub, session.name, `Returned rental #${id} (${lateDays} late days)`, "Rentals", id]
      ).catch(() => undefined);
      return NextResponse.json({ success: true, lateDays, finalAmount });
    }

    const booking = await queryOne<{ car_id: string | null; expected_return: string | null; total_amount: number }>(
      `SELECT
        ${schema?.booking_car_id ? '"carId"' : "NULL::text"} AS car_id,
        ${schema?.booking_dropoff_date ? '"dropoffDate"' : "NULL::timestamptz"} AS expected_return,
        ${schema?.booking_total_amount ? '"totalAmount"' : schema?.booking_total_price ? '"totalPrice"' : "0::numeric"} AS total_amount
       FROM "Booking" WHERE id = $1`,
      [id]
    );
    if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const returnDate = new Date(actual_return ?? new Date());
    const expectedDate = booking.expected_return ? new Date(booking.expected_return) : returnDate;
    const lateDays = Math.max(0, Math.ceil((returnDate.getTime() - expectedDate.getTime()) / 86400000));
    const lateFee = lateDays * 25;
    const finalAmount = parseFloat(String(booking.total_amount ?? 0)) + lateFee;

    const updateSets: string[] = [];
    const values: unknown[] = [];
    if (schema?.booking_status) { values.push("completed"); updateSets.push(`status = $${values.length}`); }
    if (schema?.booking_actual_return) { values.push(returnDate); updateSets.push(`"actualReturn" = $${values.length}`); }
    if (schema?.booking_odometer_in) { values.push(odometer_in ?? null); updateSets.push(`"odometerIn" = $${values.length}`); }
    if (schema?.booking_fuel_in) { values.push(fuel_in ?? null); updateSets.push(`"fuelIn" = $${values.length}`); }
    if (schema?.booking_damage_notes) { values.push(damage_notes ?? null); updateSets.push(`"damageNotes" = $${values.length}`); }
    if (schema?.booking_late_days) { values.push(lateDays); updateSets.push(`"lateDays" = $${values.length}`); }
    if (schema?.booking_total_amount) { values.push(finalAmount); updateSets.push(`"totalAmount" = $${values.length}`); }
    if (schema?.booking_total_price) { values.push(finalAmount); updateSets.push(`"totalPrice" = $${values.length}`); }
    if (schema?.booking_updated_at) { updateSets.push(`\"updatedAt\" = NOW()`); }

    if (updateSets.length) {
      values.push(id);
      await query(`UPDATE \"Booking\" SET ${updateSets.join(", ")} WHERE id = $${values.length}`, values);
    }

    if (booking.car_id && schema?.prisma_car) {
      await query(`UPDATE "Car" SET "isAvailable" = true, "updatedAt" = NOW() WHERE id = $1`, [booking.car_id]).catch(() => undefined);
    }

    return NextResponse.json({ success: true, lateDays, finalAmount });
  }

  // Generic update
  const fields = Object.keys(body).filter((k) => k !== "id" && k !== "action");
  if (!fields.length) return NextResponse.json({ error: "No fields" }, { status: 400 });

  if (useLegacy) {
    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
    const result = await query(
      `UPDATE rentals SET ${sets}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`,
      [...fields.map((f) => body[f]), id]
    );
    return NextResponse.json({ rental: result[0] });
  }

  const columnMap: Record<string, { key: string; enabled: boolean; transform?: (v: unknown) => unknown; cast?: string }> = {
    status: { key: "status", enabled: Boolean(schema?.booking_status), transform: (v) => String(v ?? "").toLowerCase() },
    start_date: { key: '"pickupDate"', enabled: Boolean(schema?.booking_pickup_date) },
    expected_return: { key: '"dropoffDate"', enabled: Boolean(schema?.booking_dropoff_date) },
    total_amount: { key: schema?.booking_total_amount ? '"totalAmount"' : '"totalPrice"', enabled: Boolean(schema?.booking_total_amount || schema?.booking_total_price) },
    customer_name: { key: '"customerName"', enabled: Boolean(schema?.booking_customer_name) },
    customer_email: { key: '"customerEmail"', enabled: Boolean(schema?.booking_customer_email) },
    customer_phone: { key: '"customerPhone"', enabled: Boolean(schema?.booking_customer_phone) },
    customer_id: { key: '"userId"', enabled: Boolean(schema?.booking_user_id) },
    car_id: { key: '"carId"', enabled: Boolean(schema?.booking_car_id) },
  };

  const updateSets: string[] = [];
  const values: unknown[] = [];

  for (const field of fields) {
    const config = columnMap[field];
    if (!config || !config.enabled) continue;
    values.push(config.transform ? config.transform(body[field]) : body[field]);
    updateSets.push(`${config.key} = $${values.length}`);
  }

  if (schema?.booking_updated_at) {
    updateSets.push('"updatedAt" = NOW()');
  }

  if (!updateSets.length) {
    return NextResponse.json({ error: "No compatible fields for this schema" }, { status: 400 });
  }

  values.push(id);
  const result = await query(
    `UPDATE "Booking" SET ${updateSets.join(", ")} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return NextResponse.json({ rental: result[0] });
}
