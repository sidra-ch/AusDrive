import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { prisma } from "@/lib/prisma";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

    const { searchParams } = new URL(req.url);
    const carId = searchParams.get('carId');

    if (carId) {
      // Get specific car's latest GPS position
      const car = await prisma.car.findUnique({
        where: { id: carId },
        select: {
          id: true,
          make: true,
          model: true,
          latitude: true,
          longitude: true,
          lastGpsUpdate: true
        }
      });

      if (!car) {
        return handleCORS(NextResponse.json({ error: 'Car not found' }, { status: 404 }), req.headers.get("origin") || undefined);
      }

      // Get recent GPS logs for this car
      const recentLogs = await prisma.gPSLog.findMany({
        where: { carId },
        orderBy: { timestamp: 'desc' },
        take: 10,
        select: {
          latitude: true,
          longitude: true,
          speed: true,
          heading: true,
          timestamp: true
        }
      });

      return handleCORS(NextResponse.json({
        car,
        recentLogs,
        hasLiveGPS: !!car.latitude && !!car.longitude
      }), req.headers.get("origin") || undefined);
    } else {
      // Get all cars with their latest GPS positions
      const cars = await prisma.car.findMany({
        where: {
          isAvailable: true // Only available cars
        },
        select: {
          id: true,
          make: true,
          model: true,
          latitude: true,
          longitude: true,
          lastGpsUpdate: true,
          dailyRate: true,
          rating: true,
          deals: true,
          imageUrl: true
        },
        orderBy: { lastGpsUpdate: 'desc' }
      });

      // Filter cars that have GPS data
      const carsWithGPS = cars.filter((car: any) => car.latitude && car.longitude);

      const tracking = carsWithGPS.map((car: any) => ({
        id: car.id,
        make: car.make,
        model: car.model,
        lat: car.latitude,
        lng: car.longitude,
        speed_kmh: 0, // Will be updated by socket.io
        fuel_level_percent: null, // Will be updated by socket.io
        lastGpsUpdate: car.lastGpsUpdate,
        dailyRate: car.dailyRate,
        rating: car.rating,
        deals: car.deals,
        imageUrl: car.imageUrl
      }));

      return handleCORS(NextResponse.json({ tracking }), req.headers.get("origin") || undefined);
    }
  } catch (error) {
    console.error('[GPS API] Error:', error);
    return handleCORS(NextResponse.json({ error: 'Failed to fetch GPS data' }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);

    const body = await req.json();
    const { carId, latitude, longitude, speed, heading } = body;

    if (!carId || !latitude || !longitude) {
      return handleCORS(NextResponse.json(
        { error: 'Missing required fields: carId, latitude, longitude' },
        { status: 400 }
      ), req.headers.get("origin") || undefined);
    }

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number' ||
        latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return handleCORS(NextResponse.json(
        { error: 'Invalid GPS coordinates' },
        { status: 400 }
      ), req.headers.get("origin") || undefined);
    }

    // Update car's current position
    const updatedCar = await prisma.car.update({
      where: { id: carId },
      data: {
        latitude,
        longitude,
        lastGpsUpdate: new Date()
      }
    });

    // Store GPS log
    const gpsLog = await prisma.gPSLog.create({
      data: {
        carId,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        timestamp: new Date()
      }
    });

    return handleCORS(NextResponse.json({
      success: true,
      car: updatedCar,
      gpsLog
    }), req.headers.get("origin") || undefined);
  } catch (error) {
    console.error('[GPS API] Error updating GPS:', error);
    return handleCORS(NextResponse.json(
      { error: 'Failed to update GPS data' },
      { status: 500 }
    ), req.headers.get("origin") || undefined);
  }
}
