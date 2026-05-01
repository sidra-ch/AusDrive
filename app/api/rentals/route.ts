import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

function normalizeEnumLike(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, "_").replace(/-/g, "_").toUpperCase();
}

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const customerId = searchParams.get("customer_id");
  const carId = searchParams.get("car_id");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const search = searchParams.get("search");

  const schemaRows = await query<{
    legacy_rentals: string | null;
    prisma_booking: string | null;
    legacy_customers: string | null;
    prisma_user: string | null;
    legacy_cars: string | null;
    prisma_car: string | null;
    legacy_payments: string | null;
    prisma_payment: string | null;
    booking_customer_name: boolean;
    booking_customer_email: boolean;
    booking_customer_phone: boolean;
    booking_user_id: boolean;
    booking_car_id: boolean;
    booking_pickup_date: boolean;
    booking_dropoff_date: boolean;
    booking_total_amount: boolean;
    booking_status: boolean;
    booking_created_at: boolean;
    car_plate_number: boolean;
    car_plate: boolean;
    car_rego: boolean;
    car_category: boolean;
    payment_booking_id: boolean;
    booking_total_price: boolean;
  }>(`SELECT
      to_regclass('public.rentals') AS legacy_rentals,
      to_regclass('public."Booking"') AS prisma_booking,
      to_regclass('public.customers') AS legacy_customers,
      to_regclass('public."User"') AS prisma_user,
      to_regclass('public.cars') AS legacy_cars,
      to_regclass('public."Car"') AS prisma_car,
      to_regclass('public.payments') AS legacy_payments,
      to_regclass('public."Payment"') AS prisma_payment,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='customerName') AS booking_customer_name,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='customerEmail') AS booking_customer_email,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='customerPhone') AS booking_customer_phone,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='userId') AS booking_user_id,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='carId') AS booking_car_id,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='pickupDate') AS booking_pickup_date,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='dropoffDate') AS booking_dropoff_date,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='totalAmount') AS booking_total_amount,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='status') AS booking_status,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='createdAt') AS booking_created_at,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='plateNumber') AS car_plate_number,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='plate') AS car_plate,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='rego') AS car_rego,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='category') AS car_category,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Payment' AND column_name='bookingId') AS payment_booking_id,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='totalPrice') AS booking_total_price`);  

  const schema = schemaRows[0];
  const usePrisma = Boolean(schema?.prisma_booking);
  const useLegacy = !usePrisma && Boolean(schema?.legacy_rentals);
  const canJoinUser = Boolean(schema?.prisma_user && schema?.booking_user_id);
  const canJoinCar = Boolean(schema?.prisma_car && schema?.booking_car_id);
  const canJoinPayment = Boolean(schema?.prisma_payment && schema?.payment_booking_id);

  if (!useLegacy && !usePrisma) {
    return handleCORS(NextResponse.json({ rentals: [] }), req.headers.get("origin") || undefined);
  }

  const plateExpr = schema?.car_plate_number ? 'ca."plateNumber"' : schema?.car_plate ? "ca.plate" : schema?.car_rego ? "ca.rego" : "NULL::text";
  const startDateExpr = schema?.booking_pickup_date ? 'b."pickupDate"' : "NULL::timestamptz";
  const expectedReturnExpr = schema?.booking_dropoff_date ? 'b."dropoffDate"' : "NULL::timestamptz";
  const totalAmountExpr = schema?.booking_total_amount ? 'b."totalAmount"' : schema?.booking_total_price ? 'b."totalPrice"' : "0::numeric";
  const statusExpr = schema?.booking_status ? "lower(b.status::text)" : "'pending'::text";
  const createdAtExpr = schema?.booking_created_at ? 'b."createdAt"' : "NOW()";
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

  let sql = useLegacy
    ? `SELECT r.*, 
      c.name as customer_name, c.email as customer_email, c.phone as customer_phone,
      ca.make, ca.model, ca.plate, ca.category,
      COALESCE(SUM(p.amount), 0) as paid_amount,
      r.total_amount - COALESCE(SUM(p.amount), 0) as balance
      FROM rentals r
      LEFT JOIN customers c ON c.id = r.customer_id
      LEFT JOIN cars ca ON ca.id = r.car_id
      LEFT JOIN payments p ON p.rental_id = r.id
      WHERE 1=1`
    : `SELECT
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
      ${totalAmountExpr} AS total_amount,
      ${statusExpr} AS status,
      COALESCE(SUM(p.amount), 0) AS paid_amount,
      ${totalAmountExpr} - COALESCE(SUM(p.amount), 0) AS balance,
      ${createdAtExpr} AS created_at
      FROM "Booking" b
      ${canJoinUser ? 'LEFT JOIN "User" u ON u.id = b."userId"' : ""}
      ${canJoinCar ? 'LEFT JOIN "Car" ca ON ca.id = b."carId"' : 'LEFT JOIN LATERAL (SELECT NULL::text AS make, NULL::text AS model, NULL::text AS plate, NULL::text AS category) ca ON true'}
      ${canJoinPayment ? 'LEFT JOIN "Payment" p ON p."bookingId" = b.id' : ""}
      WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;

  if (useLegacy) {
    if (status) { sql += ` AND r.status = $${i++}`; params.push(status); }
    if (customerId) { sql += ` AND r.customer_id = $${i++}`; params.push(customerId); }
    if (carId) { sql += ` AND r.car_id = $${i++}`; params.push(carId); }
    if (fromDate) { sql += ` AND r.start_date >= $${i++}`; params.push(fromDate); }
    if (toDate) { sql += ` AND r.start_date <= $${i++}`; params.push(toDate); }
    if (search) { sql += ` AND (c.name ILIKE $${i++} OR ca.plate ILIKE $${i})`; params.push(`%${search}%`, `%${search}%`); i++; }
    sql += " GROUP BY r.id, c.id, ca.id ORDER BY r.created_at DESC";
  } else {
    if (status && schema?.booking_status) { sql += ` AND b.status::text = $${i++}`; params.push(normalizeEnumLike(status)); }
    if (customerId && schema?.booking_user_id) { sql += ` AND b."userId" = $${i++}`; params.push(customerId); }
    if (carId && schema?.booking_car_id) { sql += ` AND b."carId" = $${i++}`; params.push(carId); }
    if (fromDate && schema?.booking_pickup_date) { sql += ` AND b."pickupDate" >= $${i++}`; params.push(fromDate); }
    if (toDate && schema?.booking_pickup_date) { sql += ` AND b."pickupDate" <= $${i++}`; params.push(toDate); }
    if (search) {
      sql += ` AND (${customerNameExpr} ILIKE $${i} OR ${plateExpr}::text ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }
    sql += ` GROUP BY b.id, ${customerNameExpr}, ${customerEmailExpr}, ${customerPhoneExpr}, ca.make, ca.model, ${plateExpr}, ${schema?.car_category ? "ca.category" : "NULL::text"}, ${startDateExpr}, ${expectedReturnExpr}, ${totalAmountExpr}, ${statusExpr}, ${createdAtExpr} ORDER BY ${createdAtExpr} DESC`;
  }

  const rentals = await query(sql, params);
  return handleCORS(NextResponse.json({ rentals }), req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  const body = await req.json();
  const { customer_id, car_id, start_date, expected_return, daily_rate, deposit, discount, late_fee_per_day, odometer_out, fuel_out } = body;
  if (!customer_id || !car_id || !start_date || !expected_return)
    return handleCORS(NextResponse.json({ error: "Required fields missing" }, { status: 400 }), req.headers.get("origin") || undefined);

  const days = Math.max(1, Math.ceil((new Date(expected_return).getTime() - new Date(start_date).getTime()) / 86400000));
  const total = (Number(daily_rate ?? 0) * days) - Number(discount ?? 0) + Number(deposit ?? 0);

  const schemaRows = await query<{
    legacy_rentals: string | null;
    legacy_cars: string | null;
    prisma_booking: string | null;
    prisma_car: string | null;
    prisma_user: string | null;
    booking_user_id: boolean;
    booking_car_id: boolean;
    booking_pickup_date: boolean;
    booking_dropoff_date: boolean;
    booking_total_amount: boolean;
    booking_status: boolean;
    booking_customer_name: boolean;
    booking_customer_email: boolean;
    booking_customer_phone: boolean;
    booking_pickup_location: boolean;
    booking_dropoff_location: boolean;
    booking_currency: boolean;
    booking_security_deposit: boolean;
    booking_daily_rate: boolean;
    booking_discount: boolean;
    booking_late_fee_per_day: boolean;
    booking_odometer_out: boolean;
    booking_fuel_out: boolean;
    booking_created_by: boolean;
    car_status: boolean;
  }>(`SELECT
      to_regclass('public.rentals') AS legacy_rentals,
      to_regclass('public.cars') AS legacy_cars,
      to_regclass('public."Booking"') AS prisma_booking,
      to_regclass('public."Car"') AS prisma_car,
      to_regclass('public."User"') AS prisma_user,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='userId') AS booking_user_id,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='carId') AS booking_car_id,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='pickupDate') AS booking_pickup_date,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='dropoffDate') AS booking_dropoff_date,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='totalAmount') AS booking_total_amount,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='totalPrice') AS booking_total_price,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='status') AS booking_status,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='customerName') AS booking_customer_name,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='customerEmail') AS booking_customer_email,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='customerPhone') AS booking_customer_phone,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='pickupLocation') AS booking_pickup_location,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='dropoffLocation') AS booking_dropoff_location,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='currency') AS booking_currency,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='securityDeposit') AS booking_security_deposit,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='dailyRate') AS booking_daily_rate,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='discount') AS booking_discount,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='lateFeePerDay') AS booking_late_fee_per_day,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='odometerOut') AS booking_odometer_out,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='fuelOut') AS booking_fuel_out,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Booking' AND column_name='createdBy') AS booking_created_by,
      EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='Car' AND column_name='status') AS car_status`);

  const schema = schemaRows[0];
  const usePrisma = Boolean(schema?.prisma_booking);
  const useLegacy = !usePrisma && Boolean(schema?.legacy_rentals);

  if (useLegacy) {
    const result = await query(
      `INSERT INTO rentals (customer_id, car_id, start_date, expected_return, daily_rate, deposit, discount, late_fee_per_day, total_amount, odometer_out, fuel_out, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [customer_id, car_id, start_date, expected_return, daily_rate, deposit ?? 500, discount ?? 0, late_fee_per_day ?? 25, total, odometer_out, fuel_out ?? 100, session.sub]
    );

    if (schema?.legacy_cars) {
      await query("UPDATE cars SET status = 'rented' WHERE id = $1", [car_id]);
    }
    await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)", [session.sub, session.name, `Created rental for car ${car_id}`, "Rentals", result[0].id]).catch(() => undefined);
    return handleCORS(NextResponse.json({ rental: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
  }

  if (!usePrisma) {
    return handleCORS(NextResponse.json({ error: "No compatible rental table found" }, { status: 500 }), req.headers.get("origin") || undefined);
  }

  const customer = schema?.prisma_user
    ? await query<{ name: string | null; email: string | null; phone: string | null }>(
        `SELECT name, email, phone FROM "User" WHERE id = $1 LIMIT 1`,
        [customer_id]
      )
    : [];
  const customerInfo = customer[0];

  const columns: string[] = [];
  const placeholders: string[] = [];
  const values: unknown[] = [];

  const addValue = (column: string, value: unknown, cast?: string) => {
    columns.push(column);
    values.push(value);
    placeholders.push(`$${values.length}${cast ?? ""}`);
  };

  if (schema?.booking_user_id) addValue('"userId"', customer_id);
  if (schema?.booking_car_id) addValue('"carId"', car_id);
  if (schema?.booking_pickup_date) addValue('"pickupDate"', start_date);
  if (schema?.booking_dropoff_date) addValue('"dropoffDate"', expected_return);
  if (schema?.booking_total_amount) addValue('"totalAmount"', total);
  if ((schema as { booking_total_price?: boolean })?.booking_total_price) addValue('"totalPrice"', total);
  if (schema?.booking_status) addValue("status", "confirmed");
  if (schema?.booking_customer_name) addValue('"customerName"', customerInfo?.name ?? "Walk-in Customer");
  if (schema?.booking_customer_email) addValue('"customerEmail"', customerInfo?.email ?? "unknown@example.com");
  if (schema?.booking_customer_phone) addValue('"customerPhone"', customerInfo?.phone ?? null);
  if (schema?.booking_pickup_location) addValue('"pickupLocation"', "Main Branch");
  if (schema?.booking_dropoff_location) addValue('"dropoffLocation"', "Main Branch");
  if (schema?.booking_currency) addValue("currency", "AUD");
  if (schema?.booking_security_deposit) addValue('"securityDeposit"', deposit ?? 500);
  if (schema?.booking_daily_rate) addValue('"dailyRate"', daily_rate ?? 0);
  if (schema?.booking_discount) addValue("discount", discount ?? 0);
  if (schema?.booking_late_fee_per_day) addValue('"lateFeePerDay"', late_fee_per_day ?? 25);
  if (schema?.booking_odometer_out) addValue('"odometerOut"', odometer_out ?? null);
  if (schema?.booking_fuel_out) addValue('"fuelOut"', fuel_out ?? 100);
  if (schema?.booking_created_by) addValue('"createdBy"', session.sub ?? null);

  if (!columns.length) {
    return handleCORS(NextResponse.json({ error: "No compatible booking columns found" }, { status: 500 }), req.headers.get("origin") || undefined);
  }

  const result = await query(
    `INSERT INTO "Booking" (${columns.join(", ")}) VALUES (${placeholders.join(", ")}) RETURNING *`,
    values
  );

  if (schema?.prisma_car) {
    await query(`UPDATE "Car" SET "isAvailable" = false, "updatedAt" = NOW() WHERE id = $1`, [car_id]).catch(() => undefined);
  }

  await query("INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)", [session.sub, session.name, `Created rental for car ${car_id}`, "Rentals", result[0].id]).catch(() => undefined);
  return handleCORS(NextResponse.json({ rental: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
}
