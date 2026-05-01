import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

async function writeAuditLog(userId: unknown, userName: unknown, action: string, module: string) {
  try {
    const reg = await query<{ legacy_audit: string | null; prisma_audit: string | null }>(
      `SELECT
        to_regclass('public.audit_logs') AS legacy_audit,
        to_regclass('public."AuditLog"') AS prisma_audit`
    );
    const tables = reg[0];

    if (tables?.legacy_audit) {
      await query(
        "INSERT INTO audit_logs (user_id, user_name, action, module) VALUES ($1, $2, $3, $4)",
        [String(userId ?? ""), String(userName ?? ""), action, module]
      );
      return;
    }

    if (tables?.prisma_audit) {
      await query(
        `INSERT INTO "AuditLog" (id, "userId", "userName", action, module, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, NOW())`,
        [String(userId ?? ""), String(userName ?? ""), action, module]
      );
    }
  } catch {
    // Non-blocking audit log.
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { cars } = body;

    if (!Array.isArray(cars) || cars.length === 0) {
      return NextResponse.json({ error: "Invalid CSV data" }, { status: 400 });
    }

    const results = { success: 0, failed: 0, errors: [] as string[] };

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
      return NextResponse.json({ error: "Cars table not found" }, { status: 500 });
    }

    for (const car of cars) {
      try {
        const { make, model, year, plate, category, daily_rate, weekend_rate, 
                status, branch, city, area, colour, transmission, fuel_type, 
                seats, bags, late_fee, deposit } = car;

        if (!make || !model || !year || !plate || !daily_rate) {
          results.failed++;
          results.errors.push(`Missing required fields for plate: ${plate || "unknown"}`);
          continue;
        }

        if (useLegacy) {
          await query(
            `INSERT INTO cars (make, model, year, plate, category, daily_rate, weekend_rate, 
              status, branch, city, area, colour, transmission, fuel_type, seats, bags, late_fee, deposit)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
             ON CONFLICT (plate) DO UPDATE SET
              make = EXCLUDED.make,
              model = EXCLUDED.model,
              year = EXCLUDED.year,
              category = EXCLUDED.category,
              daily_rate = EXCLUDED.daily_rate,
              weekend_rate = EXCLUDED.weekend_rate,
              status = EXCLUDED.status,
              branch = EXCLUDED.branch,
              city = EXCLUDED.city,
              area = EXCLUDED.area,
              colour = EXCLUDED.colour,
              transmission = EXCLUDED.transmission,
              fuel_type = EXCLUDED.fuel_type,
              seats = EXCLUDED.seats,
              bags = EXCLUDED.bags,
              updated_at = NOW()`,
            [
              make, model, parseInt(year), plate, category || "Economy", 
              parseFloat(daily_rate), parseFloat(weekend_rate || daily_rate),
              status || "available", branch || "Sydney", city, area,
              colour, transmission || "Automatic", fuel_type || "Petrol",
              parseInt(seats || "5"), parseInt(bags || "2"),
              parseFloat(late_fee || "25"), parseFloat(deposit || "500")
            ]
          );
        } else {
          await query(
            `INSERT INTO "Car" (
              id, make, model, year, "plateNumber", vin, category, status, transmission, "fuelType", seats, doors,
              color, "imageUrl", images, "dailyRate", "weeklyRate", "securityDeposit", city, location,
              odometer, features, description, "insuranceType", "insuranceExpiry", "isAvailable", "createdAt", "updatedAt"
            )
            VALUES (
              gen_random_uuid()::text, $1, $2, $3, $4, gen_random_uuid()::text,
              $5::"CarCategory", $6::"CarStatus", $7::"TransmissionType", $8::"FuelType", $9, $10,
              $11, NULL, ARRAY[]::text[], $12, $13, $14, $15, $16,
              0, ARRAY[]::text[], NULL, NULL, NULL, $17, NOW(), NOW()
            )
            ON CONFLICT ("plateNumber") DO UPDATE SET
              make = EXCLUDED.make,
              model = EXCLUDED.model,
              year = EXCLUDED.year,
              category = EXCLUDED.category,
              status = EXCLUDED.status,
              transmission = EXCLUDED.transmission,
              "fuelType" = EXCLUDED."fuelType",
              seats = EXCLUDED.seats,
              color = EXCLUDED.color,
              "dailyRate" = EXCLUDED."dailyRate",
              "weeklyRate" = EXCLUDED."weeklyRate",
              "securityDeposit" = EXCLUDED."securityDeposit",
              city = EXCLUDED.city,
              location = EXCLUDED.location,
              "isAvailable" = EXCLUDED."isAvailable",
              "updatedAt" = NOW()`,
            [
              make,
              model,
              parseInt(year),
              plate,
              mapCarCategory(category || "Economy"),
              normalizeEnumLike(status || "available"),
              mapTransmission(transmission || "Automatic"),
              mapFuelType(fuel_type || "Petrol"),
              parseInt(seats || "5"),
              4,
              colour || null,
              parseFloat(daily_rate),
              parseFloat(weekend_rate || daily_rate),
              parseFloat(deposit || "500"),
              city || branch || "Sydney",
              area || branch || "Sydney",
              normalizeEnumLike(status || "available") === "AVAILABLE",
            ]
          );
        }

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error importing ${car.plate}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    await writeAuditLog(session.sub, session.name, `Imported ${results.success} cars via CSV`, "Cars");

    return NextResponse.json({ 
      message: `Import complete: ${results.success} succeeded, ${results.failed} failed`,
      results 
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
