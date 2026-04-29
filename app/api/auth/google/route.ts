import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRefreshExpiryDate, hashToken, issueTokenPair, setAuthCookies } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { ensureAuthSchema } from "@/lib/auth-schema";
import { z } from "zod";

const googleSchema = z.object({
  idToken: z.string().min(20),
});

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    await ensureAuthSchema();

    const parsed = googleSchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleCORS(NextResponse.json({ error: "Missing Google token" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const { idToken } = parsed.data;

    // Verify token with Google API directly to avoid requiring google-auth-library
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!verifyRes.ok) {
        return handleCORS(NextResponse.json({ error: "Invalid Google token" }, { status: 400 }), req.headers.get("origin") || undefined);
    }
    
    const payload = await verifyRes.json() as {
      aud?: string;
      email?: string;
      name?: string;
      picture?: string;
      sub?: string;
      email_verified?: string;
    };
    const { email, name, sub: googleId, picture } = payload;

    const allowedAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    ].filter(Boolean);

    if (!payload.aud || !allowedAudiences.includes(payload.aud)) {
      return handleCORS(NextResponse.json({ error: "Google token audience mismatch" }, { status: 400 }), req.headers.get("origin") || undefined);
    }
    
    if (!email) {
      return handleCORS(NextResponse.json({ error: "Google account must have an associated email" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    if (!googleId) {
      return handleCORS(NextResponse.json({ error: "Invalid Google token subject" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const users = await query<{
      id: number; name: string; email: string; role: string; branch: string;
    }>("SELECT * FROM users WHERE lower(email) = $1 LIMIT 1", [email.toLowerCase()]);

    let user = users[0];

    // If user does not exist, create them
    if (!user) {
      const result = await query<{
        id: number; name: string; email: string; role: string; branch: string;
      }>(
        `INSERT INTO users (name, email, role, branch, is_active, provider, is_verified)
         VALUES ($1, $2, 'USER', 'Sydney', TRUE, 'google', TRUE)
         RETURNING id, name, email, role, branch`,
        [name || 'Google User', email.toLowerCase()]
      );
      user = result[0];

      await query("UPDATE users SET google_id = $1, profile_image = $2 WHERE id = $3", [googleId, picture ?? null, user.id]);
    } else {
      // User exists, update provider if it was empty, and ensure verified
      await query(
        "UPDATE users SET provider = 'google', is_verified = TRUE, google_id = $1, profile_image = COALESCE($2, profile_image), last_login = NOW() WHERE id = $3",
        [googleId, picture ?? null, user.id],
      );
    }

    const authPayload = {
      sub: user.id, name: user.name, email: user.email,
      role: user.role, branch: user.branch,
    };

    const { accessToken, refreshToken } = await issueTokenPair(authPayload);
    await query(
      "UPDATE users SET refresh_token_hash = $1, refresh_token_expires_at = $2 WHERE id = $3",
      [hashToken(refreshToken), getRefreshExpiryDate(), user.id],
    );

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch },
      token: accessToken,
      accessToken,
      refreshToken,
    });
    setAuthCookies(res, accessToken, refreshToken);
    
    return handleCORS(res, req.headers.get("origin") || undefined);
  } catch (err) {
    console.error(err);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
