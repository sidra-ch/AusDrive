import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();

    if (!idToken) return handleCORS(NextResponse.json({ error: "Missing Google token" }, { status: 400 }), req.headers.get("origin") || undefined);

    // Verify token with Google API directly to avoid requiring google-auth-library
    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!verifyRes.ok) {
        return handleCORS(NextResponse.json({ error: "Invalid Google token" }, { status: 400 }), req.headers.get("origin") || undefined);
    }
    
    const payload = await verifyRes.json();
    const { email, name, sub: googleId } = payload;
    
    if (!email) {
      return handleCORS(NextResponse.json({ error: "Google account must have an associated email" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const users = await query<{
      id: number; name: string; email: string; role: string; branch: string;
    }>("SELECT * FROM users WHERE email = $1 LIMIT 1", [email.toLowerCase()]);

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
    } else {
      // User exists, update provider if it was empty, and ensure verified
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
