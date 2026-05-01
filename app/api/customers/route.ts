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
  const search = searchParams.get("search");
  const status = searchParams.get("status");

  // Schema detection
  const tables = await query<{ legacy_customers: string | null; prisma_user: string | null; prisma_booking: string | null }>(
    `SELECT
      to_regclass('public.customers') AS legacy_customers,
      to_regclass('public."User"') AS prisma_user,
      to_regclass('public."Booking"') AS prisma_booking`
  );
  const schema = tables[0];
  const useLegacy = Boolean(schema?.legacy_customers);

  try {
    if (useLegacy) {
      let sql = `SELECT c.*, COUNT(r.id) as total_rentals FROM customers c LEFT JOIN rentals r ON r.customer_id = c.id WHERE 1=1`;
      const params: unknown[] = [];
      let i = 1;
      if (status) { sql += ` AND c.status = $${i++}`; params.push(status); }
      if (search) { sql += ` AND (c.name ILIKE $${i} OR c.email ILIKE $${i} OR c.phone ILIKE $${i})`; params.push(`%${search}%`); i++; }
      sql += " GROUP BY c.id ORDER BY c.created_at DESC";
      const customers = await query(sql, params);
      return handleCORS(NextResponse.json({ customers }), req.headers.get("origin") || undefined);
    }

    if (schema?.prisma_user) {
      let sql = `SELECT
        u.id::text AS id,
        u.name,
        u.email,
        u.phone,
        'active' AS status,
        u."createdAt" AS created_at,
        u.role,
        u."profileImage" AS image,
        COALESCE(b.total_rentals, 0) AS total_rentals
      FROM "User" u
      LEFT JOIN (
        SELECT "userId", COUNT(*) AS total_rentals FROM "Booking" GROUP BY "userId"
      ) b ON b."userId" = u.id
      WHERE u.role = 'USER'`;
      const params: unknown[] = [];
      let i = 1;
      if (search) {
        sql += ` AND (u.name ILIKE $${i} OR u.email ILIKE $${i} OR u.phone ILIKE $${i})`;
        params.push(`%${search}%`); i++;
      }
      sql += ' ORDER BY u."createdAt" DESC';
      const customers = await query(sql, params);
      return handleCORS(NextResponse.json({ customers }), req.headers.get("origin") || undefined);
    }

    return handleCORS(NextResponse.json({ customers: [] }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error("[Customers GET]", err);
    return handleCORS(NextResponse.json({ error: "Failed to load customers" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

  const body = await req.json() as Record<string, unknown>;
  const { name, email, phone, city, address, postcode, dob, licence_number, licence_state, licence_expiry, licence_class, notes } = body as {
    name?: string; email?: string; phone?: string; city?: string; address?: string;
    postcode?: string; dob?: string; licence_number?: string; licence_state?: string;
    licence_expiry?: string; licence_class?: string; notes?: string;
  };

  if (!name || !email) return handleCORS(NextResponse.json({ error: "Name and email required" }, { status: 400 }), req.headers.get("origin") || undefined);

  const tables = await query<{ legacy_customers: string | null; prisma_user: string | null }>(
    `SELECT to_regclass('public.customers') AS legacy_customers, to_regclass('public."User"') AS prisma_user`
  );
  const schema = tables[0];

  try {
    if (schema?.legacy_customers) {
      const result = await query(
        `INSERT INTO customers (name, email, phone, city, address, postcode, dob, licence_number, licence_state, licence_expiry, licence_class, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [name, email, phone, city, address, postcode, dob || null, licence_number, licence_state, licence_expiry || null, licence_class ?? "C", notes]
      );
      return handleCORS(NextResponse.json({ customer: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
    }

    if (schema?.prisma_user) {
      const bcrypt = await import("bcryptjs");
      const pwHash = await bcrypt.hash(Math.random().toString(36).slice(2) + "Aa1!", 10);
      const result = await query(
        `INSERT INTO "User" (id, name, email, password, phone, role, "isVerified", provider, "licenseNumber", "licenseExpiry", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'USER', true, 'email', $5, $6, NOW(), NOW())
         ON CONFLICT (email) DO NOTHING
         RETURNING id::text AS id, name, email, phone, role, 'active' AS status, '0' AS total_rentals`,
        [name, email, pwHash, phone ?? null, licence_number ?? null, licence_expiry || null]
      );
      if (!result[0]) return handleCORS(NextResponse.json({ error: "Email already exists" }, { status: 409 }), req.headers.get("origin") || undefined);
      return handleCORS(NextResponse.json({ customer: result[0] }, { status: 201 }), req.headers.get("origin") || undefined);
    }

    return handleCORS(NextResponse.json({ error: "No customers table" }, { status: 500 }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error("[Customers POST]", err);
    return handleCORS(NextResponse.json({ error: err instanceof Error ? err.message : "Failed to create customer" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}

