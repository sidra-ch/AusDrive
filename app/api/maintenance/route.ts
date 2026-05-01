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
  const carId = searchParams.get("car_id");
  const type = searchParams.get("type");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");
  const search = searchParams.get("search");

  // Schema detection
  const tables = await query<{ legacy_maint: string | null; prisma_maint: string | null }>(
    `SELECT to_regclass('public.maintenance') AS legacy_maint, to_regclass('public."Maintenance"') AS prisma_maint`
  );
  const schema = tables[0];

  try {
    if (schema?.legacy_maint) {
      let sql = `SELECT m.*, c.make, c.model, c.plate FROM maintenance m LEFT JOIN cars c ON c.id=m.car_id WHERE 1=1`;
      const params: unknown[] = [];
      let i = 1;
      if (status) { sql += ` AND m.status=$${i++}`; params.push(status); }
      if (carId) { sql += ` AND m.car_id=$${i++}`; params.push(carId); }
      if (type) { sql += ` AND m.type=$${i++}`; params.push(type); }
      if (fromDate) { sql += ` AND m.service_date>=$${i++}`; params.push(fromDate); }
      if (toDate) { sql += ` AND m.service_date<=$${i++}`; params.push(toDate); }
      sql += " ORDER BY m.service_date DESC";
      return handleCORS(NextResponse.json({ maintenance: await query(sql, params) }), req.headers.get("origin") || undefined);
    }

    if (schema?.prisma_maint) {
      let sql = `SELECT
        m.id::text AS id,
        m.type,
        m.description,
        m.cost,
        m.status,
        m."serviceDate" AS service_date,
        m."nextDueDate" AS next_due_date,
        m.notes,
        m."createdAt" AS created_at,
        ca.make, ca.model, ca.rego AS plate
      FROM "Maintenance" m
      LEFT JOIN "Car" ca ON ca.id=m."carId"
      WHERE 1=1`;
      const params: unknown[] = [];
      let i = 1;
      if (status) { sql += ` AND lower(m.status)=lower($${i++})`; params.push(status); }
      if (carId) { sql += ` AND m."carId"=$${i++}`; params.push(carId); }
      if (type) { sql += ` AND m.type ILIKE $${i++}`; params.push(`%${type}%`); }
      if (fromDate) { sql += ` AND m."serviceDate">=$${i++}`; params.push(fromDate); }
      if (toDate) { sql += ` AND m."serviceDate"<=$${i++}`; params.push(toDate); }
      if (search) { sql += ` AND (ca.make ILIKE $${i} OR ca.model ILIKE $${i} OR m.type ILIKE $${i})`; params.push(`%${search}%`); i++; }
      sql += ' ORDER BY m."serviceDate" DESC';
      return handleCORS(NextResponse.json({ maintenance: await query(sql, params) }), req.headers.get("origin") || undefined);
    }

    return handleCORS(NextResponse.json({ maintenance: [] }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error("[Maintenance GET]", err);
    return handleCORS(NextResponse.json({ error: "Failed to load maintenance" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

  const body = await req.json() as Record<string, unknown>;
  const { car_id, type, description, cost, service_date, next_due_date, status, notes } = body as {
    car_id?: string; type?: string; description?: string; cost?: number;
    service_date?: string; next_due_date?: string; status?: string; notes?: string;
  };

  if (!car_id || !type || !service_date)
    return handleCORS(NextResponse.json({ error: "car_id, type and service_date are required" }, { status: 400 }), req.headers.get("origin") || undefined);

  const tables = await query<{ legacy_maint: string | null; prisma_maint: string | null }>(
    `SELECT to_regclass('public.maintenance') AS legacy_maint, to_regclass('public."Maintenance"') AS prisma_maint`
  );
  const schema = tables[0];

  try {
    if (schema?.prisma_maint) {
      const result = await query(
        `INSERT INTO "Maintenance" (id, "carId", type, description, cost, "serviceDate", "nextDueDate", status, notes, "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id::text AS id, type, description, cost, status, "serviceDate" AS service_date, "nextDueDate" AS next_due_date, notes`,
        [car_id, type, description ?? null, Number(cost ?? 0), service_date, next_due_date || null, status ?? "scheduled", notes ?? null]
      );
      return handleCORS(NextResponse.json({ record: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
    }

    if (schema?.legacy_maint) {
      const result = await query(
        `INSERT INTO maintenance (car_id, type, description, cost, service_date, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [car_id, type, description, cost ?? 0, service_date, status ?? "scheduled", session.sub]
      );
      return handleCORS(NextResponse.json({ record: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
    }

    return handleCORS(NextResponse.json({ error: "No maintenance table" }, { status: 500 }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error("[Maintenance POST]", err);
    return handleCORS(NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create record" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}

