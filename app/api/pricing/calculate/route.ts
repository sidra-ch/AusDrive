import { NextRequest, NextResponse } from "next/server";
import { pricingService } from "@/lib/pricing";
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

    // Validate required fields
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

    if (pickup < new Date()) {
      return handleCORS(
        NextResponse.json(
          { error: "Pickup date cannot be in the past" },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    // Calculate dynamic pricing
    const pricing = await pricingService.calculateDynamicPrice({
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
        pricing,
        currency: "AUD",
        calculatedAt: new Date().toISOString()
      }),
      req.headers.get("origin") || undefined
    );
  } catch (error: any) {
    console.error("[Pricing API] Error calculating price:", error);
    return handleCORS(
      NextResponse.json(
        { error: error.message || "Failed to calculate price" },
        { status: 500 }
      ),
      req.headers.get("origin") || undefined
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const carId = searchParams.get('carId');
    const pickupDate = searchParams.get('pickupDate');
    const dropoffDate = searchParams.get('dropoffDate');
    const pickupLocation = searchParams.get('pickupLocation');

    // Validate required fields
    if (!carId || !pickupDate || !dropoffDate || !pickupLocation) {
      return handleCORS(
        NextResponse.json(
          { error: "Missing required query parameters: carId, pickupDate, dropoffDate, pickupLocation" },
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

    // Get price estimate
    const estimate = await pricingService.getPriceEstimate(
      carId,
      pickup,
      dropoff,
      pickupLocation
    );

    return handleCORS(
      NextResponse.json({
        success: true,
        estimate,
        currency: "AUD",
        estimatedAt: new Date().toISOString()
      }),
      req.headers.get("origin") || undefined
    );
  } catch (error: any) {
    console.error("[Pricing API] Error getting price estimate:", error);
    return handleCORS(
      NextResponse.json(
        { error: error.message || "Failed to get price estimate" },
        { status: 500 }
      ),
      req.headers.get("origin") || undefined
    );
  }
}
