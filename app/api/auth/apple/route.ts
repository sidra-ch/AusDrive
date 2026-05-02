import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getRefreshExpiryDate, hashToken, issueTokenPair, setAuthCookies } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { ensureAuthSchema } from "@/lib/auth-schema";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    await ensureAuthSchema();

    const { identityToken, fullName } = await req.json();

    if (!identityToken) return handleCORS(NextResponse.json({ error: "Missing Apple token" }, { status: 400 }), req.headers.get("origin") || undefined);

    // Verify Apple identity token against Apple's public keys
    const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
    let payload;
    try {
        const { payload: verifiedPayload } = await jwtVerify(identityToken, jwks, {
            issuer: 'https://appleid.apple.com',
            audience: 'com.ausdrive.fleet', // Must match bundle identifier
        });
        payload = verifiedPayload;
    } catch {
        return handleCORS(NextResponse.json({ error: "Invalid Apple token" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const email = payload.email as string | undefined;
    const appleSub = payload.sub as string; // Apple's stable unique user ID — always present

    if (!appleSub) {
      return handleCORS(NextResponse.json({ error: "Invalid Apple token: missing subject" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    // Look up by apple_sub first (handles returning users where email may be null)
    let users = await query<{
      id: number; name: string; email: string; role: string; branch: string;
    }>("SELECT id, name, email, role, branch FROM users WHERE apple_sub = $1 LIMIT 1", [appleSub]);

    // Fallback: lookup by email for users who signed up before apple_sub was stored
    if (!users[0] && email) {
      users = await query<{
        id: number; name: string; email: string; role: string; branch: string;
      }>("SELECT id, name, email, role, branch FROM users WHERE lower(email) = $1 LIMIT 1", [email.toLowerCase()]);
    }

    if (!users[0] && !email) {
      // Subsequent Apple login with no email and no existing account — cannot create account
      return handleCORS(NextResponse.json({ error: "Apple account email is required on first sign-in. Please sign out of this app from your Apple ID settings and try again." }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    let user = users[0];

    // If user does not exist, create them
    if (!user) {
      // Apple only sends fullName on the FIRST login
      const fallbackName = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : 'Apple User';
      
      const result = await query<{
        id: number; name: string; email: string; role: string; branch: string;
      }>(
        `INSERT INTO users (name, email, role, branch, is_active, provider, is_verified, apple_sub)
         VALUES ($1, $2, 'USER', 'Sydney', TRUE, 'apple', TRUE, $3)
         RETURNING id, name, email, role, branch`,
        [fallbackName || 'Apple User', email!.toLowerCase(), appleSub]
      );
      user = result[0];
    } else {
      // Ensure apple_sub is stored for existing users (backfill)
      await query("UPDATE users SET is_verified = TRUE, last_login = NOW(), apple_sub = COALESCE(apple_sub, $1) WHERE id = $2", [appleSub, user.id]);
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
