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
    const { carId, pickupDate, dropoffDate, pickupLocation, distance, promoCode } = body;

    if (!carId || !pickupDate || !dropoffDate || !pickupLocation) {
      return handleCORS(
        NextResponse.json(
          { error: "Missing required fields: carId, pickupDate, dropoffDate, pickupLocation" },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    // Validate dates
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);

    if (isNaN(pickup.getTime()) || isNaN(dropoff.getTime())) {
      return handleCORS(
        NextResponse.json(
          { error: "Invalid date format" },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    if (pickup >= dropoff) {
      return handleCORS(
        NextResponse.json(
          { error: "Dropoff date must be after pickup date" },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    // Calculate booking total
    const total = await stripeService.calculateBookingTotal({
      carId,
      pickupDate: pickup,
      dropoffDate: dropoff,
      pickupLocation,
      distance: distance || 0,
      promoCode
    });

    return handleCORS(
      NextResponse.json({
        success: true,
        total: total.total,
        breakdown: total.breakdown,
        currency: "AUD",
        calculatedAt: new Date().toISOString()
      }),
      req.headers.get("origin") || undefined
    );
  } catch (error: any) {
    console.error("[Payments API] Error calculating total:", error);
    return handleCORS(
      NextResponse.json(
        { error: error.message || "Failed to calculate total" },
        { status: 500 }
      ),
      req.headers.get("origin") || undefined
    );
  }
}
