import { NextRequest, NextResponse } from "next/server";
import { stripeService } from "@/lib/stripe";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return handleCORS(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        req.headers.get("origin") || undefined
      );
    }

    const body = await req.json();
    const { bookingId, amount, currency = 'aud', metadata } = body;

    if (!bookingId || !amount) {
      return handleCORS(
        NextResponse.json(
          { error: "Missing required fields: bookingId, amount" },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    if (amount <= 0) {
      return handleCORS(
        NextResponse.json(
          { error: "Amount must be greater than 0" },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    // Create payment intent
    const paymentIntent = await stripeService.createPaymentIntent({
      bookingId,
      amount: parseFloat(amount),
      currency,
      metadata: {
        ...metadata,
        userId: String(session.sub)
      }
    });

    return handleCORS(
      NextResponse.json({
        success: true,
        clientSecret: paymentIntent.clientSecret,
        paymentIntentId: paymentIntent.paymentIntentId
      }),
      req.headers.get("origin") || undefined
    );
  } catch (error: any) {
    console.error("[Payments API] Error creating payment intent:", error);
    return handleCORS(
      NextResponse.json(
        { error: error.message || "Failed to create payment intent" },
        { status: 500 }
      ),
      req.headers.get("origin") || undefined
    );
  }
}
