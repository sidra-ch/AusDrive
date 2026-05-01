import { NextRequest, NextResponse } from "next/server";
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

// GPS device pushes location data here
export async function POST(req: NextRequest) {
  try {
    const gpsSchemaMode = await resolveGpsSchemaMode();
    const body = await req.json();
    const { imei, lat, lng, speedKmh, heading, ignitionOn, batteryVoltage, fuelLevelPercent, recordedAt } = body;

    if (!imei || lat === undefined || lng === undefined)
      return NextResponse.json({ error: "imei, lat, lng required" }, { status: 400 });

    // Find car by IMEI (legacy schemas), or by id/rego for GPSLog+Car schema.
    const car = await queryOne<{ id: string }>(
      gpsSchemaMode === "gpslog"
        ? `SELECT id FROM "Car" WHERE id = $1 OR rego = $1 LIMIT 1`
        : "SELECT id FROM cars WHERE gps_imei = $1",
      [imei]
    );
    if (!car) return NextResponse.json({ error: "Device not registered" }, { status: 404 });

    // Insert tracking log
    if (gpsSchemaMode === "none") {
      return NextResponse.json({ error: "GPS tables are not initialized" }, { status: 503 });
    }

    if (gpsSchemaMode === "legacy") {
      await query(
        `INSERT INTO gps_tracking (car_id, lat, lng, speed, heading, ignition, fuel_level, battery_voltage, recorded_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
        [car.id, lat, lng, speedKmh ?? 0, heading ?? 0, ignitionOn ?? false,
         fuelLevelPercent, batteryVoltage, recordedAt ?? new Date()]
      );

      // Upsert live status
      await query(
        `INSERT INTO gps_live (car_id, lat, lng, speed, ignition, fuel_level, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())
         ON CONFLICT (car_id) DO UPDATE SET
           lat = EXCLUDED.lat, lng = EXCLUDED.lng, speed = EXCLUDED.speed,
           ignition = EXCLUDED.ignition, fuel_level = EXCLUDED.fuel_level, updated_at = NOW()`,
        [car.id, lat, lng, speedKmh ?? 0, ignitionOn ?? false, fuelLevelPercent]
      );
    } else if (gpsSchemaMode === "prisma") {
      await query(
        `INSERT INTO "GpsTracking" ("carId", latitude, longitude, speed, heading, "recordedAt")
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [car.id, lat, lng, speedKmh ?? 0, heading ?? 0, recordedAt ?? new Date()]
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
        [car.id, lat, lng, speedKmh ?? 0, heading ?? 0]
      );
    } else {
      await query(
        `INSERT INTO "GPSLog" ("carId", latitude, longitude, speed, accuracy, "timestamp")
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [car.id, lat, lng, speedKmh ?? 0, null, recordedAt ?? new Date()]
      );

      await query(
        `UPDATE "Car"
         SET latitude = $2, longitude = $3, "lastGpsUpdate" = NOW(), "updatedAt" = NOW()
         WHERE id = $1`,
        [car.id, lat, lng]
      );
    }

    return NextResponse.json({ success: true, car_id: car.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
