import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  REFRESH_COOKIE_NAME,
  getRefreshExpiryDate,
  hashToken,
  issueTokenPair,
  setAuthCookies,
  verifyRefreshToken,
} from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { query, queryOne } from "@/lib/db";
import { ensureAuthSchema } from "@/lib/auth-schema";

const refreshSchema = z.object({
  refreshToken: z.string().min(20).optional(),
});

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string | null;
  refresh_token_hash: string | null;
  refresh_token_expires_at: string | null;
  is_active: boolean;
};

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    await ensureAuthSchema();

    const body = await req.json().catch(() => ({}));
    const parsed = refreshSchema.safeParse(body);
    if (!parsed.success) {
      return handleCORS(NextResponse.json({ error: "Invalid refresh request" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const refreshToken = parsed.data.refreshToken || req.cookies.get(REFRESH_COOKIE_NAME)?.value;
    if (!refreshToken) {
      return handleCORS(NextResponse.json({ error: "Missing refresh token" }, { status: 401 }), req.headers.get("origin") || undefined);
    }

    const payload = await verifyRefreshToken(refreshToken);
    if (!payload?.sub) {
      return handleCORS(NextResponse.json({ error: "Invalid refresh token" }, { status: 401 }), req.headers.get("origin") || undefined);
    }

    const user = await queryOne<UserRow>(
      "SELECT id, name, email, role, branch, refresh_token_hash, refresh_token_expires_at, is_active FROM users WHERE id = $1 LIMIT 1",
      [payload.sub],
    );

    const expiresAt = user?.refresh_token_expires_at ? new Date(user.refresh_token_expires_at) : null;

    if (
      !user ||
      !user.is_active ||
      !user.refresh_token_hash ||
      user.refresh_token_hash !== hashToken(refreshToken) ||
      !expiresAt ||
      expiresAt <= new Date()
    ) {
      return handleCORS(NextResponse.json({ error: "Refresh token expired" }, { status: 401 }), req.headers.get("origin") || undefined);
    }

    const authPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
    };

    const { accessToken, refreshToken: rotatedRefreshToken } = await issueTokenPair(authPayload);

    await query(
      "UPDATE users SET refresh_token_hash = $1, refresh_token_expires_at = $2 WHERE id = $3",
      [hashToken(rotatedRefreshToken), getRefreshExpiryDate(), user.id],
    );

    const res = NextResponse.json({
      token: accessToken,
      accessToken,
      refreshToken: rotatedRefreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
    });

    setAuthCookies(res, accessToken, rotatedRefreshToken);
    return handleCORS(res, req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("[auth/refresh]", error);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
