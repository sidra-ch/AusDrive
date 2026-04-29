import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

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

        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Error importing ${car.plate}: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    await query(
      "INSERT INTO audit_logs (user_id, user_name, action, module) VALUES ($1, $2, $3, $4)",
      [session.sub, session.name, `Imported ${results.success} cars via CSV`, "Cars"]
    );

    return NextResponse.json({ 
      message: `Import complete: ${results.success} succeeded, ${results.failed} failed`,
      results 
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
