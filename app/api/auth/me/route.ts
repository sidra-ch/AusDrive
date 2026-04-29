import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  getRefreshExpiryDate,
  getSession,
  hashToken,
  issueTokenPair,
  setAuthCookies,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { queryOne, query } from "@/lib/db";
import { ensureAuthSchema } from "@/lib/auth-schema";

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

export async function GET(req: NextRequest) {
  await ensureAuthSchema();

  // Support both cookie-based sessions (web) and Bearer token (mobile)
  let session = await getSession();
  let user: UserRow | null = null;

  if (!session) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      session = await verifyAccessToken(token);
    }
  }

  if (session?.sub) {
    user = await queryOne<UserRow>(
      "SELECT id, name, email, role, branch, refresh_token_hash, refresh_token_expires_at, is_active FROM users WHERE id = $1 LIMIT 1",
      [session.sub],
    );
  }

  if (!session || !user || !user.is_active) {
    const refreshToken =
      req.cookies.get(REFRESH_COOKIE_NAME)?.value ||
      req.headers.get("x-refresh-token") ||
      req.headers.get("x-refresh-token".toUpperCase());

    if (refreshToken) {
      const refreshPayload = await verifyRefreshToken(refreshToken);

      if (refreshPayload?.sub) {
        const refreshUser = await queryOne<UserRow>(
          "SELECT id, name, email, role, branch, refresh_token_hash, refresh_token_expires_at, is_active FROM users WHERE id = $1 LIMIT 1",
          [refreshPayload.sub],
        );

        const dbHash = refreshUser?.refresh_token_hash;
        const dbExpiry = refreshUser?.refresh_token_expires_at ? new Date(refreshUser.refresh_token_expires_at) : null;

        if (
          refreshUser?.is_active &&
          dbHash &&
          dbHash === hashToken(refreshToken) &&
          dbExpiry &&
          dbExpiry > new Date()
        ) {
          const payload = {
            sub: refreshUser.id,
            name: refreshUser.name,
            email: refreshUser.email,
            role: refreshUser.role,
            branch: refreshUser.branch,
          };

          const { accessToken, refreshToken: rotatedRefreshToken } = await issueTokenPair(payload);

          await query(
            "UPDATE users SET refresh_token_hash = $1, refresh_token_expires_at = $2 WHERE id = $3",
            [hashToken(rotatedRefreshToken), getRefreshExpiryDate(), refreshUser.id],
          );

          const res = NextResponse.json({
            user: {
              id: refreshUser.id,
              name: refreshUser.name,
              email: refreshUser.email,
              role: refreshUser.role,
              branch: refreshUser.branch,
            },
            token: accessToken,
            accessToken,
            refreshToken: rotatedRefreshToken,
          });

          // Web receives secure cookies; mobile can still use response tokens.
          setAuthCookies(res, accessToken, rotatedRefreshToken);
          return handleCORS(res, req.headers.get("origin") || undefined);
        }
      }
    }
  }

  if (!session || !user || !user.is_active) {
    return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  }

  return handleCORS(
    NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
      token: req.cookies.get(AUTH_COOKIE_NAME)?.value,
    }),
    req.headers.get("origin") || undefined
  );
}
