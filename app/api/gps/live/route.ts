import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { query, queryOne } from "@/lib/db";

type GpsSchemaMode = "legacy" | "prisma" | "gpslog" | "none";

async function resolveGpsSchemaMode(): Promise<GpsSchemaMode> {
  const result = await queryOne<{
    legacy_live: string | null;
    legacy_tracking: string | null;
    prisma_live: string | null;
    prisma_tracking: string | null;
    gps_log: string | null;
    car_table: string | null;
  }>(
    `SELECT
      to_regclass('public.gps_live') AS legacy_live,
      to_regclass('public.gps_tracking') AS legacy_tracking,
      to_regclass('public."GpsLive"') AS prisma_live,
      to_regclass('public."GpsTracking"') AS prisma_tracking,
      to_regclass('public."GPSLog"') AS gps_log,
      to_regclass('public."Car"') AS car_table`
  );

  if (result?.legacy_live || result?.legacy_tracking) return "legacy";
  if (result?.prisma_live || result?.prisma_tracking) return "prisma";
  if (result?.gps_log && result?.car_table) return "gpslog";
  return "none";
}

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
    const gpsSchemaMode = await resolveGpsSchemaMode();

    const { searchParams } = new URL(req.url);
    const carId = searchParams.get('carId');

    if (carId) {
      // Get specific car's latest GPS position from live table
      const carSql = gpsSchemaMode === "legacy"
        ? `SELECT
          c.id,
          c.make,
          c.model,
          c.plate,
          c.status AS car_status,
          c.colour,
          c.gps_imei AS imei,
          gl.lat,
          gl.lng,
          COALESCE(gl.speed, 0) AS speed_kmh,
          COALESCE(gl.ignition, false) AS ignition_on,
          gl.fuel_level AS fuel_level_percent,
          COALESCE(gl.updated_at, NOW()) AS updated_at
        FROM cars c
        LEFT JOIN gps_live gl ON gl.car_id = c.id
        WHERE c.id = $1`
        : gpsSchemaMode === "prisma"
        ? `SELECT
          c.id,
          c.make,
          c.model,
          c.plate,
          c.status AS car_status,
          c.colour,
          c.gps_imei AS imei,
          gl.latitude AS lat,
          gl.longitude AS lng,
          COALESCE(gl.speed, 0) AS speed_kmh,
          false AS ignition_on,
          NULL::double precision AS fuel_level_percent,
          COALESCE(gl."updatedAt", NOW()) AS updated_at
        FROM cars c
        LEFT JOIN "GpsLive" gl ON gl."carId" = c.id
        WHERE c.id = $1`
        : gpsSchemaMode === "gpslog"
        ? `SELECT
          c.id,
          c.make,
          c.model,
          c.rego AS plate,
          CASE WHEN c."isAvailable" THEN 'available' ELSE 'rented' END AS car_status,
          c.color AS colour,
          NULL::text AS imei,
          COALESCE(gl.lat, c.latitude) AS lat,
          COALESCE(gl.lng, c.longitude) AS lng,
          COALESCE(gl.speed, 0) AS speed_kmh,
          false AS ignition_on,
          NULL::double precision AS fuel_level_percent,
          COALESCE(gl.updated_at, c."lastGpsUpdate", NOW()) AS updated_at
        FROM "Car" c
        LEFT JOIN LATERAL (
          SELECT
            g.latitude AS lat,
            g.longitude AS lng,
            g.speed,
            g."timestamp" AS updated_at
          FROM "GPSLog" g
          WHERE g."carId" = c.id
          ORDER BY g."timestamp" DESC
          LIMIT 1
        ) gl ON true
        WHERE c.id = $1`
        : `SELECT
          c.id,
          c.make,
          c.model,
          c.plate,
          c.status AS car_status,
          c.colour,
          c.gps_imei AS imei,
          NULL::double precision AS lat,
          NULL::double precision AS lng,
          0::double precision AS speed_kmh,
          false AS ignition_on,
          NULL::double precision AS fuel_level_percent,
          NOW() AS updated_at
        FROM cars c
        WHERE c.id = $1`;

      const car = await queryOne<{
        id: number;
        make: string;
        model: string;
        plate: string;
        car_status: string;
        colour: string | null;
        imei: string | null;
        lat: number | null;
        lng: number | null;
        speed_kmh: number;
        ignition_on: boolean;
        fuel_level_percent: number | null;
        updated_at: string;
      }>(carSql, [carId]);

      if (!car) {
        return handleCORS(NextResponse.json({ error: 'Car not found' }, { status: 404 }), req.headers.get("origin") || undefined);
      }

      // Get recent GPS logs for this car
      const recentLogs = gpsSchemaMode === "none"
        ? []
        : await query(
            gpsSchemaMode === "legacy"
              ? `SELECT lat AS latitude, lng AS longitude, speed, heading, recorded_at AS timestamp
                 FROM gps_tracking
                 WHERE car_id = $1
                 ORDER BY recorded_at DESC
                 LIMIT 10`
              : gpsSchemaMode === "prisma"
              ? `SELECT latitude AS latitude, longitude AS longitude, speed, heading, "recordedAt" AS timestamp
                 FROM "GpsTracking"
                 WHERE "carId" = $1
                 ORDER BY "recordedAt" DESC
                  LIMIT 10`
              : `SELECT
                   latitude AS latitude,
                   longitude AS longitude,
                   speed,
                   NULL::double precision AS heading,
                   "timestamp" AS timestamp
                 FROM "GPSLog"
                 WHERE "carId" = $1
                 ORDER BY "timestamp" DESC
                 LIMIT 10`,
            [carId]
          );

      return handleCORS(NextResponse.json({
        car,
        recentLogs,
        hasLiveGPS: car.lat !== null && car.lng !== null
      }), req.headers.get("origin") || undefined);
    } else {
      // Return all cars that have a gps_live row (real coordinates available)
      const tracking = gpsSchemaMode === "none"
        ? []
        : await query(
            gpsSchemaMode === "legacy"
          ? `SELECT
              c.id,
              c.id AS car_id,
              c.make,
              c.model,
              c.plate,
              c.status AS car_status,
              c.colour,
              c.gps_imei AS imei,
              gl.lat,
              gl.lng,
              COALESCE(gl.speed, 0) AS speed_kmh,
              COALESCE(gl.ignition, false) AS ignition_on,
              gl.fuel_level AS fuel_level_percent,
              COALESCE(gl.updated_at, NOW()) AS updated_at
            FROM gps_live gl
            JOIN cars c ON c.id = gl.car_id
            ORDER BY gl.updated_at DESC`
          : gpsSchemaMode === "prisma"
          ? `SELECT
              c.id,
              c.id AS car_id,
              c.make,
              c.model,
              c.plate,
              c.status AS car_status,
              c.colour,
              c.gps_imei AS imei,
              gl.latitude AS lat,
              gl.longitude AS lng,
              COALESCE(gl.speed, 0) AS speed_kmh,
              false AS ignition_on,
              NULL::double precision AS fuel_level_percent,
              COALESCE(gl."updatedAt", NOW()) AS updated_at
            FROM "GpsLive" gl
            JOIN cars c ON c.id = gl."carId"
            ORDER BY gl."updatedAt" DESC`
          : `SELECT
              c.id,
              c.id AS car_id,
              c.make,
              c.model,
              c.rego AS plate,
              CASE WHEN c."isAvailable" THEN 'available' ELSE 'rented' END AS car_status,
              c.color AS colour,
              NULL::text AS imei,
              COALESCE(gl.lat, c.latitude) AS lat,
              COALESCE(gl.lng, c.longitude) AS lng,
              COALESCE(gl.speed, 0) AS speed_kmh,
              false AS ignition_on,
              NULL::double precision AS fuel_level_percent,
              COALESCE(gl.updated_at, c."lastGpsUpdate", NOW()) AS updated_at
            FROM "Car" c
            LEFT JOIN LATERAL (
              SELECT
                g.latitude AS lat,
                g.longitude AS lng,
                g.speed,
                g."timestamp" AS updated_at
              FROM "GPSLog" g
              WHERE g."carId" = c.id
              ORDER BY g."timestamp" DESC
              LIMIT 1
            ) gl ON true
            ORDER BY gl.updated_at DESC`
          );

      return handleCORS(NextResponse.json({ tracking }), req.headers.get("origin") || undefined);
    }
  } catch (error) {
    console.error('[GPS API] Error:', error);
    return handleCORS(NextResponse.json({ error: 'Failed to fetch GPS data' }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
    const gpsSchemaMode = await resolveGpsSchemaMode();

    const body = await req.json();
    const { carId, latitude, longitude, speed, heading, ignitionOn, fuelLevelPercent } = body;

    if (!carId || latitude === undefined || longitude === undefined) {
      return handleCORS(NextResponse.json(
        { error: 'Missing required fields: carId, latitude, longitude' },
        { status: 400 }
      ), req.headers.get("origin") || undefined);
    }

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return handleCORS(NextResponse.json(
        { error: 'Invalid GPS coordinates' },
        { status: 400 }
      ), req.headers.get("origin") || undefined);
    }

    if (gpsSchemaMode === "none") {
      return handleCORS(NextResponse.json(
        { error: 'GPS tables are not initialized in this database' },
        { status: 503 }
      ), req.headers.get("origin") || undefined);
    }

    if (gpsSchemaMode === "legacy") {
      await query(
        `INSERT INTO gps_tracking (car_id, lat, lng, speed, heading, ignition, fuel_level, recorded_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [carId, latitude, longitude, speed ?? 0, heading ?? 0, ignitionOn ?? false, fuelLevelPercent ?? null]
      );

      await query(
        `INSERT INTO gps_live (car_id, lat, lng, speed, ignition, fuel_level, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())
         ON CONFLICT (car_id) DO UPDATE SET
           lat = EXCLUDED.lat,
           lng = EXCLUDED.lng,
           speed = EXCLUDED.speed,
           ignition = EXCLUDED.ignition,
           fuel_level = EXCLUDED.fuel_level,
           updated_at = NOW()`,
        [carId, latitude, longitude, speed ?? 0, ignitionOn ?? false, fuelLevelPercent ?? null]
      );
    } else if (gpsSchemaMode === "prisma") {
      await query(
        `INSERT INTO "GpsTracking" ("carId", latitude, longitude, speed, heading, "recordedAt")
         VALUES ($1,$2,$3,$4,$5,NOW())`,
        [carId, latitude, longitude, speed ?? 0, heading ?? 0]
      );

      await query(
        `INSERT INTO "GpsLive" ("carId", latitude, longitude, speed, heading, "updatedAt")
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT ("carId") DO UPDATE SET
           latitude = EXCLUDED.latitude,
           longitude = EXCLUDED.longitude,
           speed = EXCLUDED.speed,
           heading = EXCLUDED.heading,
           "updatedAt" = NOW()`,
        [carId, latitude, longitude, speed ?? 0, heading ?? 0]
      );
    } else {
      await query(
        `INSERT INTO "GPSLog" ("carId", latitude, longitude, speed, accuracy, "timestamp")
         VALUES ($1,$2,$3,$4,$5,NOW())`,
        [carId, latitude, longitude, speed ?? 0, null]
      );

      await query(
        `UPDATE "Car"
         SET latitude = $2, longitude = $3, "lastGpsUpdate" = NOW(), "updatedAt" = NOW()
         WHERE id = $1`,
        [carId, latitude, longitude]
      );
    }

    return handleCORS(NextResponse.json({
      success: true
    }), req.headers.get("origin") || undefined);
  } catch (error) {
    console.error('[GPS API] Error updating GPS:', error);
    return handleCORS(NextResponse.json(
      { error: 'Failed to update GPS data' },
      { status: 500 }
    ), req.headers.get("origin") || undefined);
  }
}
