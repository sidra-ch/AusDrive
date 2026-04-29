import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const carId = searchParams.get("car_id");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const params: unknown[] = [];
  let sql = `SELECT g.*, c.make, c.model, c.plate
    FROM gps_tracking g
    JOIN cars c ON c.id = g.car_id
    WHERE 1=1`;
  let i = 1;
  if (carId) { sql += ` AND g.car_id = $${i++}`; params.push(carId); }
  if (from)  { sql += ` AND g.recorded_at >= $${i++}`; params.push(from); }
  if (to)    { sql += ` AND g.recorded_at <= $${i++}`; params.push(to); }
  sql += " ORDER BY g.recorded_at DESC LIMIT 500";

  const points = await query(sql, params);
  return NextResponse.json({ points });
}
