import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

// Handle preflight requests
export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = checkRateLimit(`login_${ip}`, 10, 60000); // 10 attempts per minute
    if (!success) {
      return handleCORS(NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 }), req.headers.get("origin") || undefined);
    }

    const { email, password } = await req.json();
    if (!email || !password)
      return handleCORS(NextResponse.json({ error: "Email and password required" }, { status: 400 }), req.headers.get("origin") || undefined);

    const users = await query<{
      id: number; name: string; email: string; password: string | null; role: string; branch: string; is_verified: boolean;
    }>("SELECT * FROM users WHERE email = $1 AND is_active = TRUE LIMIT 1", [email.toLowerCase().trim()]);

    const user = users[0];
    if (!user || !user.password) {
      // Return same generic error to prevent email enumeration
      return handleCORS(NextResponse.json({ error: "Invalid credentials" }, { status: 401 }), req.headers.get("origin") || undefined);
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return handleCORS(NextResponse.json({ error: "Invalid credentials" }, { status: 401 }), req.headers.get("origin") || undefined);

    // Update last login
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

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
