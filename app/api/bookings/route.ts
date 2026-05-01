import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession, verifyToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

async function getSessionFromRequest(req: NextRequest) {
  let session = await getSession();
  if (!session) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      session = await verifyToken(authHeader.slice(7));
    }
  }
  return session;
}

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest(req);
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const isAdmin = ["ADMIN", "STAFF", "SUPER_ADMIN"].includes(session.role);

  // Schema detection
  const tables = await query<{ legacy_bookings: string | null; prisma_booking: string | null }>(
    `SELECT
      to_regclass('public.bookings') AS legacy_bookings,
      to_regclass('public."Booking"') AS prisma_booking`
  );
  const schema = tables[0];
  const useLegacy = Boolean(schema?.legacy_bookings);
  const usePrisma = Boolean(schema?.prisma_booking) && !useLegacy;

  if (!useLegacy && !usePrisma) {
    return handleCORS(NextResponse.json({ bookings: [] }), req.headers.get("origin") || undefined);
  }

  let sql: string;
  const params: unknown[] = [];
  let i = 1;

  if (useLegacy) {
    sql = `SELECT b.id, b.status, b.created_at,
      b.pickup_date AS start_date, b.return_date AS end_date,
      b.total_price AS total_amount,
      c.name AS customer_name,
      ca.make AS car_make, ca.model AS car_model
    FROM bookings b
    LEFT JOIN customers c ON c.id = b.customer_id
    LEFT JOIN cars ca ON ca.id = b.car_id
    WHERE 1=1`;
    if (!isAdmin) { sql += ` AND b.created_by = $${i++}`; params.push(session.sub); }
    if (status) { sql += ` AND b.status = $${i++}`; params.push(status); }
    if (search) { sql += ` AND (c.name ILIKE $${i} OR ca.make ILIKE $${i} OR ca.model ILIKE $${i})`; params.push(`%${search}%`); i++; }
    sql += " ORDER BY b.created_at DESC";
  } else {
    sql = `SELECT
      b.id::text AS id,
      b.status,
      b."createdAt" AS created_at,
      b."pickupDate" AS start_date,
      b."dropoffDate" AS end_date,
      b."totalPrice" AS total_amount,
      b."pickupLocation" AS pickup_location,
      COALESCE(u.name, b."userId"::text) AS customer_name,
      u.email AS customer_email,
      u.phone AS customer_phone,
      ca.make AS car_make,
      ca.model AS car_model,
      ca.rego AS car_plate,
      ca."dailyRate" AS daily_rate
    FROM "Booking" b
    LEFT JOIN "User" u ON u.id = b."userId"
    LEFT JOIN "Car" ca ON ca.id = b."carId"
    WHERE 1=1`;
    if (!isAdmin) { sql += ` AND b."userId" = $${i++}`; params.push(session.sub); }
    if (status) { sql += ` AND lower(b.status) = lower($${i++})`; params.push(status); }
    if (search) {
      sql += ` AND (u.name ILIKE $${i} OR ca.make ILIKE $${i} OR ca.model ILIKE $${i} OR ca.rego ILIKE $${i})`;
      params.push(`%${search}%`); i++;
    }
    sql += ' ORDER BY b."createdAt" DESC';
  }

  try {
    const bookings = await query(sql, params);
    return handleCORS(NextResponse.json({ bookings }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error("[Bookings GET]", err);
    return handleCORS(NextResponse.json({ error: "Failed to load bookings" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  const session = await getSessionFromRequest(req);
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), origin);

  const body = await req.json() as Record<string, unknown>;
  const { car_id, pickup_date, return_date, pickup_location, notes, customer_id } = body as {
    car_id?: string; pickup_date?: string; return_date?: string;
    pickup_location?: string; notes?: string; customer_id?: string;
  };

  if (!car_id || !pickup_date || !return_date)
    return handleCORS(NextResponse.json({ error: "car_id, pickup_date and return_date are required" }, { status: 400 }), origin);

  const pickup = new Date(pickup_date);
  const dropoff = new Date(return_date);
  if (isNaN(pickup.getTime()) || isNaN(dropoff.getTime()) || dropoff <= pickup)
    return handleCORS(NextResponse.json({ error: "Invalid date range" }, { status: 400 }), origin);

  const isAdmin = ["ADMIN", "STAFF", "SUPER_ADMIN"].includes(session.role);

  try {
    // Check schema
    const tables = await query<{ legacy_bookings: string | null; prisma_booking: string | null }>(
      `SELECT to_regclass('public.bookings') AS legacy_bookings, to_regclass('public."Booking"') AS prisma_booking`
    );
    const schema = tables[0];
    const useLegacy = Boolean(schema?.legacy_bookings);
    const usePrisma = Boolean(schema?.prisma_booking) && !useLegacy;

    if (usePrisma) {
      // Get car to calculate price
      const cars = await query<{ id: string; dailyRate: number; isAvailable: boolean }>(
        `SELECT id, "dailyRate", "isAvailable" FROM "Car" WHERE id = $1`,
        [car_id]
      );
      if (!cars[0]) return handleCORS(NextResponse.json({ error: "Car not found" }, { status: 404 }), origin);
      if (!cars[0].isAvailable) return handleCORS(NextResponse.json({ error: "Car is not available" }, { status: 409 }), origin);

      const days = Math.max(1, Math.ceil((dropoff.getTime() - pickup.getTime()) / 86400000));
      const pricePerDay = Number(cars[0].dailyRate);
      const totalPrice = pricePerDay * days;
      const userId = customer_id ?? session.sub;
      const status = isAdmin ? "confirmed" : "pending";

      // Check for overlapping bookings
      const overlap = await query(
        `SELECT id FROM "Booking" WHERE "carId" = $1 AND status NOT IN ('cancelled','canceled')
         AND "pickupDate" < $3 AND "dropoffDate" > $2`,
        [car_id, pickup, dropoff]
      );
      if (overlap.length > 0) return handleCORS(NextResponse.json({ error: "Car is not available for this period" }, { status: 409 }), origin);

      const result = await query(
        `INSERT INTO "Booking" (id, "userId", "carId", status, "pickupDate", "dropoffDate", "pickupLocation", "dropoffLocation", "totalPrice", "pricePerDay", "specialRequests", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $6, $7, $8, $9, NOW(), NOW())
         RETURNING id::text AS id, status, "pickupDate" AS start_date, "dropoffDate" AS end_date, "totalPrice" AS total_amount`,
        [userId, car_id, status, pickup, dropoff, pickup_location ?? "Sydney CBD", totalPrice, pricePerDay, notes ?? null]
      );

      return handleCORS(NextResponse.json({ booking: result[0] }, { status: 201 }), origin);
    }

    if (useLegacy) {
      const initialStatus = isAdmin ? "PENDING" : "PENDING_PAYMENT";
      const result = await query(
        `INSERT INTO bookings (customer_id, car_id, pickup_date, return_date, pickup_location, notes, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
        [customer_id ?? null, car_id, pickup_date, return_date, pickup_location ?? null, notes ?? null, initialStatus, session.sub]
      );
      return handleCORS(NextResponse.json({ booking: result[0] }, { status: 201 }), origin);
    }

    return handleCORS(NextResponse.json({ error: "No bookings table found" }, { status: 500 }), origin);
  } catch (err) {
    console.error("[Bookings POST]", err);
    return handleCORS(NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create booking" }, { status: 500 }), origin);
  }
}
