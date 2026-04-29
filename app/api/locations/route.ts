import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city");

  let sql = "SELECT * FROM locations WHERE is_active = TRUE";
  const params: unknown[] = [];

  if (city) {
    sql += " AND city = $1";
    params.push(city);
  }

  sql += " ORDER BY city, area";

  const locations = await query(sql, params);
  
  // Group by city
  const grouped = locations.reduce((acc: Record<string, unknown[]>, loc: Record<string, unknown>) => {
    const cityName = String(loc.city);
    if (!acc[cityName]) acc[cityName] = [];
    acc[cityName].push(loc);
    return acc;
  }, {});

  return NextResponse.json({ locations, grouped });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { city, area, state, postcode } = body;

  if (!city || !area || !state) {
    return NextResponse.json({ error: "City, area, and state are required" }, { status: 400 });
  }

  const result = await query(
    "INSERT INTO locations (city, area, state, postcode) VALUES ($1, $2, $3, $4) RETURNING *",
    [city, area, state, postcode]
  );

  await query(
    "INSERT INTO audit_logs (user_id, user_name, action, module) VALUES ($1, $2, $3, $4)",
    [session.sub, session.name, `Added location ${city} - ${area}`, "Locations"]
  );

  return NextResponse.json({ location: result[0] }, { status: 201 });
}
