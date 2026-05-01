import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { getRefreshExpiryDate, hashToken, issueTokenPair, setAuthCookies } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { ensureAuthSchema } from "@/lib/auth-schema";

async function safePasswordCompare(plain: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch (error) {
    console.warn("[auth/login] Invalid password hash format", error);
    return false;
  }
}

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

// Handle preflight requests
export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    await ensureAuthSchema();

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = checkRateLimit(`login_${ip}`, 10, 60000); // 10 attempts per minute
    if (!success) {
      return handleCORS(NextResponse.json({ error: "Too many login attempts. Please try again later." }, { status: 429 }), req.headers.get("origin") || undefined);
    }

    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleCORS(NextResponse.json({ error: "Valid email and password are required" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const { email, password } = parsed.data;

    const users = await query<{
      id: number;
      name: string;
      email: string;
      password: string | null;
      role: string;
      branch: string;
      is_verified: boolean;
      provider: string | null;
    }>("SELECT * FROM users WHERE email = $1 AND is_active = TRUE LIMIT 1", [email.toLowerCase().trim()]);

    const user = users[0];
    if (!user || !user.password) {
      // Return same generic error to prevent email enumeration
      return handleCORS(NextResponse.json({ error: "Invalid credentials" }, { status: 401 }), req.headers.get("origin") || undefined);
    }

    const valid = await safePasswordCompare(password, user.password);
    if (!valid) return handleCORS(NextResponse.json({ error: "Invalid credentials" }, { status: 401 }), req.headers.get("origin") || undefined);

    // Admin/staff roles bypass email verification (they are provisioned by the system)
    const isPrivilegedRole = ["ADMIN", "STAFF", "SUPER_ADMIN"].includes(user.role?.toUpperCase?.() ?? "");
    if (user.provider === "email" && !user.is_verified && !isPrivilegedRole) {
      return handleCORS(
        NextResponse.json({ error: "Please verify your email before signing in" }, { status: 403 }),
        req.headers.get("origin") || undefined,
      );
    }

    // Update last login
    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const payload = {
      sub: user.id, name: user.name, email: user.email,
      role: user.role, branch: user.branch,
    };

    const { accessToken, refreshToken } = await issueTokenPair(payload);
    const refreshExpiresAt = getRefreshExpiryDate();

    await query(
      "UPDATE users SET refresh_token_hash = $1, refresh_token_expires_at = $2 WHERE id = $3",
      [hashToken(refreshToken), refreshExpiresAt, user.id],
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
