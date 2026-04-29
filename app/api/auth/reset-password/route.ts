import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = checkRateLimit(`reset_${ip}`, 5, 60000); 
    if (!success) {
      return handleCORS(NextResponse.json({ error: "Too many requests" }, { status: 429 }), req.headers.get("origin") || undefined);
    }

    const { token, newPassword } = await req.json();

    if (!token || !newPassword)
      return handleCORS(NextResponse.json({ error: "Token and new password are required" }, { status: 400 }), req.headers.get("origin") || undefined);

    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword))
      return handleCORS(NextResponse.json({ error: "Password must be at least 8 characters long, contain an uppercase letter and a number." }, { status: 400 }), req.headers.get("origin") || undefined);

    const users = await query<{
      id: number;
    }>("SELECT id FROM users WHERE reset_token = $1 AND reset_token_expiry > NOW() LIMIT 1", [token]);

    const user = users[0];
    if (!user) return handleCORS(NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 }), req.headers.get("origin") || undefined);

    const hashed = await bcrypt.hash(newPassword, 12);

    await query("UPDATE users SET password = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2", [hashed, user.id]);

    return handleCORS(NextResponse.json({ message: "Password reset successfully!" }, { status: 200 }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error(err);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
