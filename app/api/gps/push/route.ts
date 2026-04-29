import { NextRequest, NextResponse } from "next/server";
import { query, queryOne } from "@/lib/db";

// GPS device pushes location data here
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imei, lat, lng, speedKmh, heading, ignitionOn, batteryVoltage, fuelLevelPercent, recordedAt } = body;

    if (!imei || lat === undefined || lng === undefined)
      return NextResponse.json({ error: "imei, lat, lng required" }, { status: 400 });

    // Find car by IMEI
    const car = await queryOne<{ id: number }>("SELECT id FROM cars WHERE gps_imei = $1", [imei]);
    if (!car) return NextResponse.json({ error: "Device not registered" }, { status: 404 });

    // Insert tracking log
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

    return NextResponse.json({ success: true, car_id: car.id });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
