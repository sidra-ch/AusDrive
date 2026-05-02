import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";
import { getSession } from "@/lib/auth";

function normalizeEnumLike(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, "_").replace(/-/g, "_").toUpperCase();
}

function mapTransmission(value: unknown): string {
  const normalized = normalizeEnumLike(value);
  if (normalized === "AUTO") return "AUTOMATIC";
  return normalized;
}

function mapFuelType(value: unknown): string {
  const normalized = normalizeEnumLike(value);
  if (normalized === "GAS") return "PETROL";
  return normalized;
}

async function writeAuditLog(userId: unknown, userName: unknown, action: string, module: string, recordId?: string) {
  try {
    const reg = await query<{ legacy_audit: string | null; prisma_audit: string | null }>(
      `SELECT
        to_regclass('public.audit_logs') AS legacy_audit,
        to_regclass('public."AuditLog"') AS prisma_audit`
    );
    const tables = reg[0];
    if (tables?.legacy_audit) {
      if (recordId) {
        await query(
          "INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)",
          [String(userId ?? ""), String(userName ?? ""), action, module, recordId]
        );
      } else {
        await query(
          "INSERT INTO audit_logs (user_id, user_name, action, module) VALUES ($1,$2,$3,$4)",
          [String(userId ?? ""), String(userName ?? ""), action, module]
        );
      }
      return;
    }

    if (tables?.prisma_audit) {
      await query(
        `INSERT INTO "AuditLog" (id, "userId", "userName", action, module, "recordId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [String(userId ?? ""), String(userName ?? ""), action, module, recordId ?? null]
      );
    }
  } catch {
    // Avoid blocking core APIs when audit storage differs between deployments.
  }
}

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const tableMode = await queryOne<{ legacy_cars: string | null; prisma_car: string | null; legacy_rentals: string | null; prisma_booking: string | null; legacy_maint: string | null; prisma_maint: string | null; booking_customer_name: boolean; booking_customer_email: boolean; booking_car_id: boolean; booking_status: boolean; booking_created_at: boolean; booking_pickup_date: boolean; booking_dropoff_date: boolean; booking_total_amount: boolean }>(
    `SELECT
      to_regclass('public.cars') AS legacy_cars,
      to_regclass('public."Car"') AS prisma_car,
      to_regclass('public.rentals') AS legacy_rentals,
      to_regclass('public."Booking"') AS prisma_booking,
      to_regclass('public.maintenance') AS legacy_maint,
      to_regclass('public."Maintenance"') AS prisma_maint,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking' AND column_name = 'customerName'
      ) AS booking_customer_name,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking' AND column_name = 'customerEmail'
      ) AS booking_customer_email,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking' AND column_name = 'carId'
      ) AS booking_car_id,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking' AND column_name = 'status'
      ) AS booking_status,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking' AND column_name = 'createdAt'
      ) AS booking_created_at,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking' AND column_name = 'pickupDate'
      ) AS booking_pickup_date,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking' AND column_name = 'dropoffDate'
      ) AS booking_dropoff_date,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Booking' AND column_name = 'totalAmount'
      ) AS booking_total_amount`
  );
  const hasLegacy = Boolean(tableMode?.legacy_cars);
  const hasPrisma = Boolean(tableMode?.prisma_car);
  const usePrisma = hasPrisma;
  const useLegacy = !usePrisma && hasLegacy;
  const canUseBookingRentals = Boolean(
    tableMode?.prisma_booking &&
    tableMode?.booking_car_id &&
    tableMode?.booking_status &&
    tableMode?.booking_created_at &&
    tableMode?.booking_pickup_date &&
    tableMode?.booking_dropoff_date
  );

  if (!useLegacy && !usePrisma) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gpsTables = await queryOne<{ legacy_live: string | null; prisma_live: string | null; gps_log: string | null }>(
    `SELECT
      to_regclass('public.gps_live') AS legacy_live,
      to_regclass('public."GpsLive"') AS prisma_live,
      to_regclass('public."GPSLog"') AS gps_log`
  );
  const gpsSql = gpsTables?.legacy_live
    ? "SELECT * FROM gps_live WHERE car_id = $1"
    : gpsTables?.prisma_live
    ? "SELECT \"carId\" AS car_id, latitude AS lat, longitude AS lng, speed, heading, \"updatedAt\" AS updated_at FROM \"GpsLive\" WHERE \"carId\" = $1"
    : gpsTables?.gps_log
    ? "SELECT \"carId\" AS car_id, latitude AS lat, longitude AS lng, speed, NULL::double precision AS heading, \"timestamp\" AS updated_at FROM \"GPSLog\" WHERE \"carId\" = $1 ORDER BY \"timestamp\" DESC LIMIT 1"
    : null;
  const car = useLegacy
    ? await queryOne("SELECT * FROM cars WHERE id = $1", [id])
    : await queryOne(
        `SELECT
          c.id::text AS id,
          c.make,
          c.model,
          c.rego AS plate,
          c.year,
          CASE WHEN c."isAvailable" THEN 'available' ELSE 'rented' END AS status,
          'Economy' AS category,
          c.color AS colour,
          c.transmission,
          c."fuelType" AS fuel_type,
          c.seats,
          0::int AS bags,
          c.mileage AS odometer,
          c."dailyRate"::text AS daily_rate,
          NULL::text AS deposit,
          c.location AS branch,
          c.city,
          c.location AS area,
          c."imageUrl" AS image_url,
          NULL::text AS insurance_policy,
          NULL::text AS insurance_provider,
          NULL::text AS insurance_expiry,
          c."createdAt" AS created_at,
          c.features,
          c.rating
         FROM "Car" c
         WHERE c.id = $1`,
        [id]
      );
  if (!car) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const rentals = useLegacy
    ? await query(
        "SELECT r.*, c.name as customer_name FROM rentals r LEFT JOIN customers c ON c.id = r.customer_id WHERE r.car_id = $1 ORDER BY r.created_at DESC LIMIT 10",
        [id]
      )
    : canUseBookingRentals
    ? await query(
        `SELECT
          b.id::text AS id,
          COALESCE(u.name, b."userId"::text) AS customer_name,
          b."pickupDate" AS start_date,
          b."dropoffDate" AS expected_return,
          b."totalPrice" AS total_amount,
          lower(b.status::text) AS status,
          b."createdAt" AS created_at
         FROM "Booking" b
         LEFT JOIN "User" u ON u.id = b."userId"
         WHERE b."carId" = $1
         ORDER BY b."createdAt" DESC
         LIMIT 10`,
        [id]
      )
    : [];

  const maintenance = useLegacy
    ? await query("SELECT * FROM maintenance WHERE car_id = $1 ORDER BY service_date DESC LIMIT 10", [id])
    : tableMode?.prisma_maint
    ? await query(
        `SELECT
          m.id::text AS id,
          m.type,
          m.cost,
          m.status,
          m."serviceDate" AS service_date
         FROM "Maintenance" m
         WHERE m."carId" = $1
         ORDER BY m."serviceDate" DESC
         LIMIT 10`,
        [id]
      )
    : [];

  const gps = gpsSql ? await queryOne(gpsSql, [id]) : null;
  return NextResponse.json({ car, rentals, maintenance, gps });
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  const tableMode = await queryOne<{ legacy_cars: string | null; prisma_car: string | null }>(
    `SELECT
      to_regclass('public.cars') AS legacy_cars,
      to_regclass('public."Car"') AS prisma_car`
  );
  const hasLegacy = Boolean(tableMode?.legacy_cars);
  const hasPrisma = Boolean(tableMode?.prisma_car);
  const usePrisma = hasPrisma;
  const useLegacy = !usePrisma && hasLegacy;

  if (!useLegacy && !usePrisma) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let result: Record<string, unknown>[] = [];

  if (useLegacy) {
    const fields = Object.keys(body).filter((k) => k !== "id");
    if (!fields.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    const sets = fields.map((f, i) => `${f} = $${i + 1}`).join(", ");
    const values = fields.map((f) => body[f]);
    result = await query(`UPDATE cars SET ${sets}, updated_at = NOW() WHERE id = $${fields.length + 1} RETURNING *`, [...values, id]);
  } else {
    const mappings: Record<string, { column: string; transform?: (v: unknown) => unknown }> = {
      make: { column: "make" },
      model: { column: "model" },
      year: { column: "year" },
      plate: { column: 'rego' },
      transmission: { column: "transmission", transform: (v) => mapTransmission(String(v)) },
      fuel_type: { column: '"fuelType"', transform: (v) => mapFuelType(String(v)) },
      seats: { column: "seats" },
      colour: { column: "color" },
      odometer: { column: 'mileage' },
      daily_rate: { column: '"dailyRate"' },
      city: { column: "city" },
      area: { column: "location" },
      branch: { column: "location" },
      image_url: { column: '"imageUrl"' },
      features: { column: 'features' },
    };

    const sets: string[] = [];
    const values: unknown[] = [];
    let i = 1;

    for (const [key, val] of Object.entries(body as Record<string, unknown>)) {
      if (key === "id") continue;
      const map = mappings[key];
      if (!map) continue;

      const transformed = map.transform ? map.transform(val) : val;
      sets.push(`${map.column} = $${i++}`);
      values.push(transformed);
    }

    if (!sets.length) return NextResponse.json({ error: "No fields to update" }, { status: 400 });

    values.push(id);
    result = await query(
      `UPDATE "Car" SET ${sets.join(", ")}, "updatedAt" = NOW() WHERE id = $${i} RETURNING
        id::text AS id,
        make,
        model,
        rego AS plate,
        year,
        CASE WHEN "isAvailable" THEN 'available' ELSE 'rented' END AS status,
        'Economy' AS category,
        color AS colour,
        transmission,
        "fuelType" AS fuel_type,
        seats,
        0::int AS bags,
        mileage AS odometer,
        "dailyRate"::text AS daily_rate,
        NULL::text AS deposit,
        location AS branch,
        city,
        location AS area,
        "imageUrl" AS image_url,
        NULL::text AS insurance_policy,
        NULL::text AS insurance_provider,
        NULL::text AS insurance_expiry,
        "createdAt" AS created_at`,
      values
    );
  }

  if (!result[0]) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await writeAuditLog(session.sub, session.name, `Updated car ID ${id}`, "Cars", id);
  return NextResponse.json({ car: result[0] });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const tableMode = await queryOne<{ legacy_cars: string | null; prisma_car: string | null }>(
    `SELECT
      to_regclass('public.cars') AS legacy_cars,
      to_regclass('public."Car"') AS prisma_car`
  );
  const hasLegacy = Boolean(tableMode?.legacy_cars);
  const hasPrisma = Boolean(tableMode?.prisma_car);
  const usePrisma = hasPrisma;
  const useLegacy = !usePrisma && hasLegacy;

  if (useLegacy) {
    await query("DELETE FROM cars WHERE id = $1", [id]);
  } else if (usePrisma) {
    await query('DELETE FROM "Car" WHERE id = $1', [id]);
  } else {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await writeAuditLog(session.sub, session.name, `Deleted car ID ${id}`, "Cars", id);
  return NextResponse.json({ success: true });
}
