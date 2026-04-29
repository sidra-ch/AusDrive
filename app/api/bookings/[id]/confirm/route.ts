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

/**
 * PATCH /api/bookings/:id/confirm
 * Admin-only: confirms a PENDING booking (e.g. cash payment).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = req.headers.get("origin") || undefined;
  const session = await getSessionFromRequest(req);
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), origin);

  const isAdmin = ["ADMIN", "STAFF", "SUPER_ADMIN"].includes(session.role);
  if (!isAdmin) return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }), origin);

  const { id } = await params;

  const rows = await query<{ id: number; status: string }>(
    "SELECT id, status FROM bookings WHERE id = $1",
    [id]
  );

  if (!rows.length) return handleCORS(NextResponse.json({ error: "Booking not found" }, { status: 404 }), origin);

  if (rows[0].status === "CONFIRMED" || rows[0].status === "confirmed") {
    return handleCORS(NextResponse.json({ error: "Booking is already confirmed" }, { status: 409 }), origin);
  }

  await query("UPDATE bookings SET status = 'CONFIRMED', updated_at = NOW() WHERE id = $1", [id]);

  await query(
    "INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)",
    [session.sub, session.name, `Confirmed booking ${id}`, "Bookings", id]
  ).catch(() => {});

  return handleCORS(NextResponse.json({ success: true, message: "Booking confirmed" }), origin);
}
