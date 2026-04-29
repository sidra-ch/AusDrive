import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

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

  let sql = `SELECT c.*, 
    CONCAT(cu.name) as current_customer
    FROM cars c
    LEFT JOIN rentals r ON r.car_id = c.id AND r.status = 'active'
    LEFT JOIN customers cu ON cu.id = r.customer_id
    WHERE 1=1`;
  const params: unknown[] = [];
  let i = 1;

  if (status) { sql += ` AND c.status = $${i++}`; params.push(status); }
  if (category) { sql += ` AND c.category = $${i++}`; params.push(category); }
  if (branch) { sql += ` AND c.branch = $${i++}`; params.push(branch); }
  if (city) { sql += ` AND c.city = $${i++}`; params.push(city); }
  if (area) { sql += ` AND c.area = $${i++}`; params.push(area); }
  if (search) { sql += ` AND (c.make ILIKE $${i} OR c.model ILIKE $${i} OR c.plate ILIKE $${i})`; params.push(`%${search}%`); i++; }
  sql += " ORDER BY c.created_at DESC";

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

    const result = await query(
      `INSERT INTO cars (make, model, year, plate, vin, category, daily_rate, weekend_rate, late_fee, deposit,
        seats, bags, colour, transmission, fuel_type, branch, city, area, gps_imei,
        insurance_policy, insurance_provider, insurance_expiry, notes, image_url, odometer)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25)
       RETURNING *`,
      [make, model, year, plate, vin, category ?? "Economy", daily_rate, weekend_rate, late_fee ?? 25,
       deposit ?? 500, seats ?? 5, bags ?? 2, colour, transmission ?? "Automatic",
       fuel_type ?? "Petrol", branch ?? "Sydney", city, area, gps_imei, insurance_policy,
       insurance_provider, insurance_expiry || null, notes, image_url, odometer ?? 0]
    );

    await query(
      "INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)",
      [session.sub, session.name, `Added car ${make} ${model} (${plate})`, "Cars", result[0].id]
    );

    return handleCORS(NextResponse.json({ car: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("Create car error:", error);
    return handleCORS(NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save car" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
