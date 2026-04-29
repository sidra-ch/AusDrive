import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = checkRateLimit(`verify_${ip}`, 10, 60000); 
    if (!success) {
      return handleCORS(NextResponse.json({ error: "Too many requests" }, { status: 429 }), req.headers.get("origin") || undefined);
    }

    const { token } = await req.json();

    if (!token)
      return handleCORS(NextResponse.json({ error: "Token is required" }, { status: 400 }), req.headers.get("origin") || undefined);

    const users = await query<{
      id: number;
    }>("SELECT id FROM users WHERE verification_token = $1 LIMIT 1", [token]);

    const user = users[0];
    if (!user) return handleCORS(NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 }), req.headers.get("origin") || undefined);

    // Mark as verified and remove token
    await query("UPDATE users SET is_verified = TRUE, verification_token = NULL WHERE id = $1", [user.id]);

    return handleCORS(NextResponse.json({ message: "Email successfully verified!" }, { status: 200 }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error(err);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
