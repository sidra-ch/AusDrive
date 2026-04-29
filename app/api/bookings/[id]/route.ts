import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession, verifyToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

async function getSessionFromRequest(req: NextRequest) {
  let session = await getSession();
  if (!session) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      session = await verifyToken(authHeader.slice(7));
    }
  }
  return session;
}

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = req.headers.get("origin") || undefined;
  const session = await getSessionFromRequest(req);
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), origin);

  const { id } = await params;

  const rows = await query(
    `SELECT b.*, c.name as customer_name, c.email as customer_email,
      ca.make, ca.model, ca.plate, ca.image_url
     FROM bookings b
     LEFT JOIN customers c ON c.id = b.customer_id
     LEFT JOIN cars ca ON ca.id = b.car_id
     WHERE b.id = $1`,
    [id]
  );

  if (!rows.length) return handleCORS(NextResponse.json({ error: "Not found" }, { status: 404 }), origin);

  const booking = rows[0] as Record<string, unknown>;
  const isAdmin = ["ADMIN", "STAFF", "SUPER_ADMIN"].includes(session.role);

  // Non-admins can only view their own bookings
  if (!isAdmin && String(booking.created_by) !== String(session.sub)) {
    return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }), origin);
  }

  return handleCORS(NextResponse.json({ booking }), origin);
}
