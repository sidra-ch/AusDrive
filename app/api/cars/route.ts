import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

function normalizeEnumLike(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, "_").replace(/-/g, "_").toUpperCase();
}

function mapCarCategory(value: unknown): string {
  const normalized = normalizeEnumLike(value);
  if (normalized === "PEOPLE_MOVER") return "VAN";
  if (normalized === "UTE") return "SUV";
  return normalized;
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

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");
  const branch = searchParams.get("branch");
  const city = searchParams.get("city");
  const area = searchParams.get("area");
  const search = searchParams.get("search");

  const tables = await query<{
    legacy_cars: string | null;
    prisma_car: string | null;
    legacy_rentals: string | null;
    prisma_booking: string | null;
    legacy_customers: string | null;
    car_plate_number: boolean;
    car_plate: boolean;
    car_rego: boolean;
    car_daily_rate_camel: boolean;
    car_daily_rate_snake: boolean;
    car_color: boolean;
    car_colour: boolean;
    car_created_at_camel: boolean;
    car_created_at_snake: boolean;
    car_city: boolean;
    car_location: boolean;
    car_status: boolean;
    car_category: boolean;
    car_is_available: boolean;
    car_mileage: boolean;
  }>(`SELECT
      to_regclass('public.cars') AS legacy_cars,
      to_regclass('public."Car"') AS prisma_car,
      to_regclass('public.rentals') AS legacy_rentals,
      to_regclass('public."Booking"') AS prisma_booking,
      to_regclass('public.customers') AS legacy_customers,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'plateNumber'
      ) AS car_plate_number,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'plate'
      ) AS car_plate,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'dailyRate'
      ) AS car_daily_rate_camel,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'daily_rate'
      ) AS car_daily_rate_snake,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'color'
      ) AS car_color,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'colour'
      ) AS car_colour,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'createdAt'
      ) AS car_created_at_camel,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'created_at'
      ) AS car_created_at_snake,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'city'
      ) AS car_city,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'location'
      ) AS car_location,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'status'
      ) AS car_status,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'category'
      ) AS car_category,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'rego'
      ) AS car_rego,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'isAvailable'
      ) AS car_is_available,
      EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'Car' AND column_name = 'mileage'
      ) AS car_mileage`);

  const schema = tables[0];
  const hasLegacy = Boolean(schema?.legacy_cars);
  const hasPrisma = Boolean(schema?.prisma_car);
  const usePrisma = hasPrisma;
  const useLegacy = !usePrisma && hasLegacy;
  const plateExpr = schema?.car_plate_number ? 'c."plateNumber"' : schema?.car_plate ? "c.plate" : schema?.car_rego ? "c.rego" : "NULL::text";
  const dailyRateExpr = schema?.car_daily_rate_camel ? 'c."dailyRate"' : schema?.car_daily_rate_snake ? "c.daily_rate" : "NULL::numeric";
  const colourExpr = schema?.car_color ? "c.color" : schema?.car_colour ? "c.colour" : "NULL::text";
  const createdAtExpr = schema?.car_created_at_camel ? 'c."createdAt"' : schema?.car_created_at_snake ? "c.created_at" : "NOW()";
  const statusExpr = schema?.car_status
    ? 'lower(c.status::text)'
    : schema?.car_is_available
    ? 'CASE WHEN c."isAvailable" THEN \'available\' ELSE \'rented\' END'
    : "'available'";

  if (!useLegacy && !usePrisma) {
    return handleCORS(NextResponse.json({ cars: [] }), req.headers.get("origin") || undefined);
  }

  let sql = useLegacy
    ? `SELECT c.*,
         CONCAT(cu.name) as current_customer
       FROM cars c
       LEFT JOIN rentals r ON r.car_id = c.id AND r.status = 'active'
       LEFT JOIN customers cu ON cu.id = r.customer_id
       WHERE 1=1`
    : `SELECT
         c.id::text AS id,
         c.make,
         c.model,
         ${plateExpr} AS plate,
         c.year,
         ${statusExpr} AS status,
         ${schema?.car_category ? "initcap(replace(c.category::text, '_', ' '))" : "'Economy'"} AS category,
         ${dailyRateExpr}::text AS daily_rate,
         ${colourExpr} AS colour,
         ${schema?.car_mileage ? 'c.mileage' : 'NULL::int'} AS mileage,
         c."imageUrl" AS image_url,
         c.transmission,
         c."fuelType" AS fuel_type,
         c.city,
         c.location,
         c.seats,
         c.features,
         NULL::text AS current_customer,
         ${createdAtExpr} AS created_at
       FROM "Car" c
       WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;

  if (useLegacy) {
    if (status) { sql += ` AND c.status = $${i++}`; params.push(status); }
    if (category) { sql += ` AND c.category = $${i++}`; params.push(category); }
    if (branch) { sql += ` AND c.branch = $${i++}`; params.push(branch); }
    if (city) { sql += ` AND c.city = $${i++}`; params.push(city); }
    if (area) { sql += ` AND c.area = $${i++}`; params.push(area); }
    if (search) { sql += ` AND (c.make ILIKE $${i} OR c.model ILIKE $${i} OR c.plate ILIKE $${i})`; params.push(`%${search}%`); i++; }
    sql += " ORDER BY c.created_at DESC";
  } else {
    if (status && schema?.car_status) { sql += ` AND c.status::text = $${i++}`; params.push(normalizeEnumLike(status)); }
    if (category && schema?.car_category) { sql += ` AND c.category::text = $${i++}`; params.push(mapCarCategory(category)); }
    if (branch && schema?.car_location) { sql += ` AND c.location ILIKE $${i++}`; params.push(`%${branch}%`); }
    if (city && schema?.car_city) { sql += ` AND c.city = $${i++}`; params.push(city); }
    if (area && schema?.car_location) { sql += ` AND c.location ILIKE $${i++}`; params.push(`%${area}%`); }
    if (search) {
      sql += ` AND (c.make ILIKE $${i} OR c.model ILIKE $${i} OR ${plateExpr}::text ILIKE $${i})`;
      params.push(`%${search}%`);
      i++;
    }
    sql += " ORDER BY created_at DESC";
  }

  const cars = await query(sql, params);
  return handleCORS(NextResponse.json({ cars }), req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

    const body = await req.json();
    const { make, model, year, plate, category, daily_rate, weekend_rate, late_fee, deposit,
      seats, bags, colour, transmission, fuel_type, branch, city, area, gps_imei,
      insurance_policy, insurance_provider, insurance_expiry, notes, image_url, vin, odometer } = body;

    if (!make || !model || !year || !plate || !daily_rate)
      return handleCORS(NextResponse.json({ error: "Required fields missing" }, { status: 400 }), req.headers.get("origin") || undefined);

    const tableCheck = await query<{ legacy_cars: string | null; prisma_car: string | null }>(
      `SELECT
        to_regclass('public.cars') AS legacy_cars,
        to_regclass('public."Car"') AS prisma_car`
    );

    const hasLegacy = Boolean(tableCheck[0]?.legacy_cars);
    const hasPrisma = Boolean(tableCheck[0]?.prisma_car);
    const usePrisma = hasPrisma;
    const useLegacy = !usePrisma && hasLegacy;

    if (!useLegacy && !usePrisma) {
      return handleCORS(NextResponse.json({ error: "Cars table not found" }, { status: 500 }), req.headers.get("origin") || undefined);
    }

    const result = useLegacy
      ? await query(
          `INSERT INTO cars (make, model, year, plate, vin, category, daily_rate, weekend_rate, late_fee, deposit,
            seats, bags, colour, transmission, fuel_type, branch, city, area, gps_imei,
            insurance_policy, insurance_provider, insurance_expiry, notes, image_url, odometer)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
           RETURNING *`,
          [make, model, year, plate, vin, category ?? "Economy", daily_rate, weekend_rate, late_fee ?? 25,
            deposit ?? 500, seats ?? 5, bags ?? 2, colour, transmission ?? "Automatic",
            fuel_type ?? "Petrol", branch ?? "Sydney", city, area, gps_imei, insurance_policy,
            insurance_provider, insurance_expiry || null, notes, image_url, odometer ?? 0]
        )
      : await query(
          `INSERT INTO "Car" (
            id, make, model, year, rego, color, seats, transmission, "fuelType",
            mileage, "dailyRate", city, location, "imageUrl", features, "isAvailable",
            "createdAt", "updatedAt"
          )
          VALUES (
            gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8,
            $9, $10, $11, $12, $13, $14, true,
            NOW(), NOW()
          )
          ON CONFLICT DO NOTHING
          RETURNING
            id::text AS id,
            make,
            model,
            rego AS plate,
            year,
            CASE WHEN "isAvailable" THEN 'available' ELSE 'rented' END AS status,
            'Economy' AS category,
            "dailyRate"::text AS daily_rate,
            color AS colour,
            "createdAt" AS created_at,
            location AS branch,
            city,
            location AS area,
            NULL::text AS deposit,
            "fuelType" AS fuel_type,
            transmission,
            seats,
            mileage AS odometer,
            "imageUrl" AS image_url`,
          [
            make,
            model,
            Number(year),
            plate,
            colour ?? null,
            Number(seats ?? 5),
            mapTransmission(transmission ?? "Automatic"),
            mapFuelType(fuel_type ?? "Petrol"),
            Number(odometer ?? 0),
            Number(daily_rate),
            city ?? branch ?? "Sydney",
            area ?? branch ?? city ?? "Sydney",
            image_url ?? null,
            notes ?? null,
          ]
        );

    await writeAuditLog(session.sub, session.name, `Added car ${make} ${model} (${plate})`, "Cars", String(result[0].id));

    return handleCORS(NextResponse.json({ car: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Create car error:", error);
    return handleCORS(NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save car" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
