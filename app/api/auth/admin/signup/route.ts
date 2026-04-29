import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { signToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { canUseAdminSignup, isStrongPassword } from "@/lib/admin-auth";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, adminSecretKey } = await req.json();

    if (!name || !email || !password) {
      return handleCORS(
        NextResponse.json({ error: "Name, email and password are required" }, { status: 400 }),
        req.headers.get("origin") || undefined,
      );
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return handleCORS(
        NextResponse.json({ error: "Invalid email address" }, { status: 400 }),
        req.headers.get("origin") || undefined,
      );
    }

    if (!isStrongPassword(String(password))) {
      return handleCORS(
        NextResponse.json({ error: "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol" }, { status: 400 }),
        req.headers.get("origin") || undefined,
      );
    }

    if (!canUseAdminSignup(normalizedEmail, adminSecretKey)) {
      return handleCORS(
        NextResponse.json({ error: "Admin signup is restricted to approved domains or a valid admin secret key" }, { status: 403 }),
        req.headers.get("origin") || undefined,
      );
    }

    const existing = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
    if (existing.length > 0) {
      return handleCORS(
        NextResponse.json({ error: "An account with this email already exists" }, { status: 409 }),
        req.headers.get("origin") || undefined,
      );
    }

    const hashed = await bcrypt.hash(String(password), 12);
    const result = await query<{ id: number; name: string; email: string; role: string; branch: string }>(
      `INSERT INTO users (name, email, password, role, branch, is_active)
       VALUES ($1, $2, $3, 'ADMIN', 'Sydney', TRUE)
       RETURNING id, name, email, role, branch`,
      [String(name).trim(), normalizedEmail, hashed],
    );

    const admin = result[0];
    const token = await signToken({
      sub: admin.id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      branch: admin.branch,
    });

    const res = NextResponse.json({
      user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, branch: admin.branch },
    }, { status: 201 });

    res.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return handleCORS(res, req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("[admin/signup]", error);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
