import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { isAdminRole } from "@/lib/admin-auth";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return handleCORS(
        NextResponse.json({ error: "Email and password required" }, { status: 400 }),
        req.headers.get("origin") || undefined,
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const users = await query<{
      id: number;
      name: string;
      email: string;
      password: string | null;
      role: string;
      branch: string;
      is_active: boolean;
    }>(
      "SELECT id, name, email, password, role, branch, is_active FROM users WHERE email = $1 LIMIT 1",
      [normalizedEmail],
    );

    const user = users[0];
    if (!user || !user.password || !user.is_active || !isAdminRole(user.role)) {
      return handleCORS(
        NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 }),
        req.headers.get("origin") || undefined,
      );
    }

    const valid = await bcrypt.compare(String(password), user.password);
    if (!valid) {
      return handleCORS(
        NextResponse.json({ error: "Invalid admin credentials" }, { status: 401 }),
        req.headers.get("origin") || undefined,
      );
    }

    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const token = await signToken({
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
    });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, branch: user.branch },
    });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return handleCORS(res, req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("[admin/login]", error);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
