import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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

    const userId = String(session.sub);

    const body = await req.json();
    const { deviceToken, deviceType, deviceName } = body;

    if (!deviceToken || !deviceType) {
      return handleCORS(
        NextResponse.json(
          { error: "Missing required fields: deviceToken, deviceType" },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    // Validate device type
    if (!['ios', 'android', 'web'].includes(deviceType)) {
      return handleCORS(
        NextResponse.json(
          { error: "Invalid device type. Must be: ios, android, or web" },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    // Check if device token already exists
    const existingDevice = await prisma.userDevice.findFirst({
      where: { deviceToken }
    });

    if (existingDevice) {
      // Update existing device
      const updatedDevice = await prisma.userDevice.update({
        where: { id: existingDevice.id },
        data: {
          userId,
          deviceType,
          deviceName: deviceName || `${deviceType} Device`,
          isActive: true,
          updatedAt: new Date()
        }
      });

      return handleCORS(
        NextResponse.json({
          success: true,
          device: updatedDevice,
          message: "Device token updated successfully"
        }),
        req.headers.get("origin") || undefined
      );
    } else {
      // Create new device registration
      const newDevice = await prisma.userDevice.create({
        data: {
          userId,
          deviceToken,
          deviceType,
          deviceName: deviceName || `${deviceType} Device`,
          isActive: true
        }
      });

      return handleCORS(
        NextResponse.json({
          success: true,
          device: newDevice,
          message: "Device token registered successfully"
        }),
        req.headers.get("origin") || undefined
      );
    }
  } catch (error: any) {
    console.error("[Notifications API] Error registering device:", error);
    return handleCORS(
      NextResponse.json(
        { error: "Failed to register device token" },
        { status: 500 }
      ),
      req.headers.get("origin") || undefined
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return handleCORS(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        req.headers.get("origin") || undefined
      );
    }

    const userId = String(session.sub);

    const { searchParams } = new URL(req.url);
    const deviceToken = searchParams.get('deviceToken');

    if (!deviceToken) {
      return handleCORS(
        NextResponse.json(
          { error: "Missing deviceToken parameter" },
          { status: 400 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    // Delete device token
    const deletedDevice = await prisma.userDevice.deleteMany({
      where: {
        deviceToken,
        userId // Ensure user can only delete their own devices
      }
    });

    if (deletedDevice.count === 0) {
      return handleCORS(
        NextResponse.json(
          { error: "Device token not found or doesn't belong to user" },
          { status: 404 }
        ),
        req.headers.get("origin") || undefined
      );
    }

    return handleCORS(
      NextResponse.json({
        success: true,
        message: "Device token unregistered successfully"
      }),
      req.headers.get("origin") || undefined
    );
  } catch (error: any) {
    console.error("[Notifications API] Error unregistering device:", error);
    return handleCORS(
      NextResponse.json(
        { error: "Failed to unregister device token" },
        { status: 500 }
      ),
      req.headers.get("origin") || undefined
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return handleCORS(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        req.headers.get("origin") || undefined
      );
    }

    const userId = String(session.sub);

    // Get all devices for the user
    const devices = await prisma.userDevice.findMany({
      where: { userId },
      select: {
        id: true,
        deviceToken: true,
        deviceType: true,
        deviceName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return handleCORS(
      NextResponse.json({
        success: true,
        devices,
        count: devices.length
      }),
      req.headers.get("origin") || undefined
    );
  } catch (error: any) {
    console.error("[Notifications API] Error fetching devices:", error);
    return handleCORS(
      NextResponse.json(
        { error: "Failed to fetch devices" },
        { status: 500 }
      ),
      req.headers.get("origin") || undefined
    );
  }
}
