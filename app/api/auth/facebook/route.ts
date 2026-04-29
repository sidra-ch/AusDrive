import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const { accessToken } = await req.json();

    if (!accessToken) return handleCORS(NextResponse.json({ error: "Missing Facebook token" }, { status: 400 }), req.headers.get("origin") || undefined);

    const verifyRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
    if (!verifyRes.ok) {
        return handleCORS(NextResponse.json({ error: "Invalid Facebook token" }, { status: 400 }), req.headers.get("origin") || undefined);
    }
    
    const payload = await verifyRes.json();
    const { email, name, id: facebookId } = payload;
    
    if (!email) {
      return handleCORS(NextResponse.json({ error: "Facebook account must share email address" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    let users = await query<{
      id: number; name: string; email: string; role: string; branch: string;
    }>("SELECT * FROM users WHERE email = $1 LIMIT 1", [email.toLowerCase()]);

    let user = users[0];

    // If user does not exist, create them
    if (!user) {
      const result = await query<{
        id: number; name: string; email: string; role: string; branch: string;
      }>(
        `INSERT INTO users (name, email, role, branch, is_active, provider, is_verified)
         VALUES ($1, $2, 'USER', 'Sydney', TRUE, 'facebook', TRUE)
         RETURNING id, name, email, role, branch`,
        [name || 'Facebook User', email.toLowerCase()]
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
