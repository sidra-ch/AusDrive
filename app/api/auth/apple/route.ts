import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const { identityToken, fullName } = await req.json();

    if (!identityToken) return handleCORS(NextResponse.json({ error: "Missing Apple token" }, { status: 400 }), req.headers.get("origin") || undefined);

    // Verify Apple identity token
    const jwks = createRemoteJWKSet(new URL('https://appleid.apple.com/auth/keys'));
    let payload;
    try {
        const { payload: verifiedPayload } = await jwtVerify(identityToken, jwks, {
            issuer: 'https://appleid.apple.com',
            // audience is usually your app's bundle ID e.g., com.ausdrive.premium
        });
        payload = verifiedPayload;
    } catch (e) {
        return handleCORS(NextResponse.json({ error: "Invalid Apple token" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const email = payload.email as string;
    
    if (!email) {
      return handleCORS(NextResponse.json({ error: "Apple account must share email address" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const users = await query<{
      id: number; name: string; email: string; role: string; branch: string;
    }>("SELECT * FROM users WHERE email = $1 LIMIT 1", [email.toLowerCase()]);

    let user = users[0];

    // If user does not exist, create them
    if (!user) {
      // Apple only sends fullName on the FIRST login
      const fallbackName = fullName ? `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim() : 'Apple User';
      
      const result = await query<{
        id: number; name: string; email: string; role: string; branch: string;
      }>(
        `INSERT INTO users (name, email, role, branch, is_active, provider, is_verified)
         VALUES ($1, $2, 'USER', 'Sydney', TRUE, 'apple', TRUE)
         RETURNING id, name, email, role, branch`,
        [fallbackName || 'Apple User', email.toLowerCase()]
      );
      user = result[0];
    } else {
      await query("UPDATE users SET is_verified = TRUE, last_login = NOW() WHERE id = $1", [user.id]);
    }

    const token = await signToken({
      sub: user.id, name: user.name, email: user.email,
      role: user.role, branch: user.branch,
    });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch },
      token,
    });
    res.cookies.set("auth_token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/",
    });
    
    return handleCORS(res, req.headers.get("origin") || undefined);
  } catch (err) {
    console.error(err);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
