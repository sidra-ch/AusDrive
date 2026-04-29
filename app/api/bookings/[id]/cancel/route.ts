import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession, verifyToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { stripeService } from "@/lib/stripe";

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
 * PATCH /api/bookings/:id/cancel
 * Cancel a booking. If a Stripe payment was completed, triggers a full refund.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const origin = req.headers.get("origin") || undefined;
  const session = await getSessionFromRequest(req);
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), origin);

  const { id } = await params;

  // Fetch the booking
  const rows = await query<{
    id: number;
    status: string;
    created_by: number;
    customer_id: number;
  }>(
    "SELECT id, status, created_by, customer_id FROM bookings WHERE id = $1",
    [id]
  );

  if (!rows.length) return handleCORS(NextResponse.json({ error: "Booking not found" }, { status: 404 }), origin);

  const booking = rows[0];
  const isAdmin = ["ADMIN", "STAFF", "SUPER_ADMIN"].includes(session.role);

  // Non-admins can only cancel their own bookings
  if (!isAdmin && String(booking.created_by) !== String(session.sub)) {
    return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }), origin);
  }

  // Already cancelled or completed cannot be cancelled
  if (booking.status === "CANCELLED" || booking.status === "cancelled") {
    return handleCORS(NextResponse.json({ error: "Booking is already cancelled" }, { status: 409 }), origin);
  }
  if (booking.status === "COMPLETED" || booking.status === "completed") {
    return handleCORS(NextResponse.json({ error: "Completed bookings cannot be cancelled" }, { status: 409 }), origin);
  }

  let refundResult: { refundId?: string } | null = null;

  // Check if there is a completed Stripe payment for this booking
  const payments = await query<{ stripe_id: string; status: string }>(
    "SELECT stripe_id, status FROM payments WHERE booking_id = $1 AND status IN ('paid', 'COMPLETED') AND stripe_id IS NOT NULL LIMIT 1",
    [id]
  );

  if (payments.length > 0 && payments[0].stripe_id) {
    // Trigger Stripe refund — stripeService handles payment & booking status update
    const result = await stripeService.refundPayment(payments[0].stripe_id);
    if (!result.success) {
      console.error(`[Cancel Booking] Refund failed for booking ${id}:`, result.error);
      return handleCORS(
        NextResponse.json({ error: `Refund failed: ${result.error}` }, { status: 500 }),
        origin
      );
    }
    refundResult = { refundId: result.refundId };
    // stripeService.refundPayment already sets booking status to CANCELLED via Prisma
  } else {
    // No payment to refund — just cancel directly
    await query("UPDATE bookings SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1", [id]);
  }

  await query(
    "INSERT INTO audit_logs (user_id, user_name, action, module, record_id) VALUES ($1,$2,$3,$4,$5)",
    [session.sub, session.name, `Cancelled booking ${id}`, "Bookings", id]
  ).catch(() => {});

  return handleCORS(
    NextResponse.json({
      success: true,
      message: refundResult ? "Booking cancelled and refund initiated" : "Booking cancelled",
      refundId: refundResult?.refundId ?? null,
    }),
    origin
  );
}
