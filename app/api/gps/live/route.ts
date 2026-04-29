import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { query, queryOne } from "@/lib/db";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

    const { searchParams } = new URL(req.url);
    const carId = searchParams.get('carId');

    if (carId) {
      // Get specific car's latest GPS position from live table
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
      }>(
        `SELECT
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
        WHERE c.id = $1`,
        [Number(carId)]
      );

      if (!car) {
        return handleCORS(NextResponse.json({ error: 'Car not found' }, { status: 404 }), req.headers.get("origin") || undefined);
      }

      // Get recent GPS logs for this car
      const recentLogs = await query(
        `SELECT lat AS latitude, lng AS longitude, speed, heading, recorded_at AS timestamp
         FROM gps_tracking
         WHERE car_id = $1
         ORDER BY recorded_at DESC
         LIMIT 10`,
        [Number(carId)]
      );

      return handleCORS(NextResponse.json({
        car,
        recentLogs,
        hasLiveGPS: car.lat !== null && car.lng !== null
      }), req.headers.get("origin") || undefined);
    } else {
      // Return all cars that have a gps_live row (real coordinates available)
      const tracking = await query(
        `SELECT
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

    await query(
      `INSERT INTO gps_tracking (car_id, lat, lng, speed, heading, ignition, fuel_level, recorded_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
      [Number(carId), latitude, longitude, speed ?? 0, heading ?? 0, ignitionOn ?? false, fuelLevelPercent ?? null]
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
      [Number(carId), latitude, longitude, speed ?? 0, ignitionOn ?? false, fuelLevelPercent ?? null]
    );

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
