import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
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
        NextResponse.json({ error: "Missing required fields: deviceToken, deviceType" }, { status: 400 }),
        req.headers.get("origin") || undefined
      );
    }

    if (!["ios", "android", "web"].includes(deviceType)) {
      return handleCORS(
        NextResponse.json({ error: "Invalid device type. Must be: ios, android, or web" }, { status: 400 }),
        req.headers.get("origin") || undefined
      );
    }

    await query(`
      CREATE TABLE IF NOT EXISTS user_devices (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        platform TEXT NOT NULL,
        device_name TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const existing = await query<{ id: number }>(
      "SELECT id FROM user_devices WHERE token = $1 LIMIT 1",
      [deviceToken]
    );

    if (existing.length > 0) {
      const updated = await query<Record<string, unknown>>(
        `UPDATE user_devices
            SET user_id = $1, platform = $2, device_name = $3, is_active = TRUE, updated_at = NOW()
          WHERE id = $4
          RETURNING *`,
        [userId, deviceType, deviceName || `${deviceType} Device`, existing[0].id]
      );
      return handleCORS(
        NextResponse.json({ success: true, device: updated[0], message: "Device token updated successfully" }),
        req.headers.get("origin") || undefined
      );
    }

    const created = await query<Record<string, unknown>>(
      `INSERT INTO user_devices (user_id, token, platform, device_name, is_active)
       VALUES ($1, $2, $3, $4, TRUE)
       RETURNING *`,
      [userId, deviceToken, deviceType, deviceName || `${deviceType} Device`]
    );

    return handleCORS(
      NextResponse.json({ success: true, device: created[0], message: "Device token registered successfully" }),
      req.headers.get("origin") || undefined
    );
  } catch (error) {
    console.error("[Notifications API] Error registering device:", error);
    return handleCORS(
      NextResponse.json({ error: "Failed to register device token" }, { status: 500 }),
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
    const deviceToken = searchParams.get("deviceToken");

    if (!deviceToken) {
      return handleCORS(
        NextResponse.json({ error: "Missing deviceToken parameter" }, { status: 400 }),
        req.headers.get("origin") || undefined
      );
    }

    const deleted = await query<{ id: number }>(
      "DELETE FROM user_devices WHERE token = $1 AND user_id = $2 RETURNING id",
      [deviceToken, userId]
    );

    if (deleted.length === 0) {
      return handleCORS(
        NextResponse.json({ error: "Device token not found or doesn't belong to user" }, { status: 404 }),
        req.headers.get("origin") || undefined
      );
    }

    return handleCORS(
      NextResponse.json({ success: true, message: "Device token unregistered successfully" }),
      req.headers.get("origin") || undefined
    );
  } catch (error) {
    console.error("[Notifications API] Error unregistering device:", error);
    return handleCORS(
      NextResponse.json({ error: "Failed to unregister device token" }, { status: 500 }),
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

    const devices = await query<Record<string, unknown>>(
      "SELECT id, token, platform, device_name, is_active, created_at, updated_at FROM user_devices WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    return handleCORS(
      NextResponse.json({ success: true, devices, count: devices.length }),
      req.headers.get("origin") || undefined
    );
  } catch (error) {
    console.error("[Notifications API] Error fetching devices:", error);
    return handleCORS(
      NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 }),
      req.headers.get("origin") || undefined
    );
  }
}
