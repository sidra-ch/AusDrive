import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookies, verifyAccessToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { query } from "@/lib/db";
import { ensureAuthSchema } from "@/lib/auth-schema";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  await ensureAuthSchema();

  const token = req.cookies.get("auth_token")?.value;
  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload?.sub) {
      await query("UPDATE users SET refresh_token_hash = NULL, refresh_token_expires_at = NULL WHERE id = $1", [payload.sub]);
    }
  }

  const res = NextResponse.json({ success: true });
  clearAuthCookies(res);
  return handleCORS(res, req.headers.get("origin") || undefined);
}
