import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { queryOne } from "@/lib/db";

type GpsSchemaMode = "legacy" | "prisma" | "gpslog" | "none";

async function resolveGpsSchemaMode(): Promise<GpsSchemaMode> {
  const result = await queryOne<{
    legacy_tracking: string | null;
    prisma_tracking: string | null;
    gps_log: string | null;
    car_table: string | null;
  }>(
    `SELECT
      to_regclass('public.gps_tracking') AS legacy_tracking,
      to_regclass('public."GpsTracking"') AS prisma_tracking,
      to_regclass('public."GPSLog"') AS gps_log,
      to_regclass('public."Car"') AS car_table`
  );

  if (result?.legacy_tracking) return "legacy";
  if (result?.prisma_tracking) return "prisma";
  if (result?.gps_log && result?.car_table) return "gpslog";
  return "none";
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const gpsSchemaMode = await resolveGpsSchemaMode();

  if (gpsSchemaMode === "none") {
    return NextResponse.json({ points: [] });
  }

  const { searchParams } = new URL(req.url);
  const carId = searchParams.get("car_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const params: unknown[] = [];
  let sql = gpsSchemaMode === "legacy"
    ? `SELECT g.*, c.make, c.model, c.plate
    FROM gps_tracking g
    JOIN cars c ON c.id = g.car_id
    WHERE 1=1`
    : gpsSchemaMode === "prisma"
    ? `SELECT
    g.id,
    g."carId" AS car_id,
    g.latitude AS lat,
    g.longitude AS lng,
    g.speed,
    g.heading,
    g."recordedAt" AS recorded_at,
    c.make,
    c.model,
    c.plate
    FROM "GpsTracking" g
    JOIN cars c ON c.id = g."carId"
    WHERE 1=1`
    : `SELECT
    g.id,
    g."carId" AS car_id,
    g.latitude AS lat,
    g.longitude AS lng,
    g.speed,
    NULL::double precision AS heading,
    g."timestamp" AS recorded_at,
    c.make,
    c.model,
    c.rego AS plate
    FROM "GPSLog" g
    JOIN "Car" c ON c.id = g."carId"
    WHERE 1=1`;
  let i = 1;
  if (carId) {
    sql += gpsSchemaMode === "legacy" ? ` AND g.car_id = $${i++}` : ` AND g."carId" = $${i++}`;
    params.push(carId);
  }
  if (from) {
    sql += gpsSchemaMode === "legacy"
      ? ` AND g.recorded_at >= $${i++}`
      : gpsSchemaMode === "prisma"
      ? ` AND g."recordedAt" >= $${i++}`
      : ` AND g."timestamp" >= $${i++}`;
    params.push(from);
  }
  if (to) {
    sql += gpsSchemaMode === "legacy"
      ? ` AND g.recorded_at <= $${i++}`
      : gpsSchemaMode === "prisma"
      ? ` AND g."recordedAt" <= $${i++}`
      : ` AND g."timestamp" <= $${i++}`;
    params.push(to);
  }
  sql += gpsSchemaMode === "legacy"
    ? " ORDER BY g.recorded_at DESC LIMIT 500"
    : gpsSchemaMode === "prisma"
    ? " ORDER BY g.\"recordedAt\" DESC LIMIT 500"
    : " ORDER BY g.\"timestamp\" DESC LIMIT 500";

  const points = await query(sql, params);
  return NextResponse.json({ points });
}
