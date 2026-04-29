import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { sendEmail } from "@/lib/email";
import crypto from "crypto";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = checkRateLimit(`forgot_${ip}`, 3, 60000); 
    if (!success) {
      return handleCORS(NextResponse.json({ error: "Too many requests" }, { status: 429 }), req.headers.get("origin") || undefined);
    }

    const { email } = await req.json();
    if (!email)
      return handleCORS(NextResponse.json({ error: "Email is required" }, { status: 400 }), req.headers.get("origin") || undefined);

    const users = await query<{
      id: number; provider: string;
    }>("SELECT id, provider FROM users WHERE email = $1 LIMIT 1", [email.toLowerCase().trim()]);

    const user = users[0];
    
    // Always return a success-like message even if user doesn't exist (security)
    if (!user) {
      return handleCORS(NextResponse.json({ message: "If your email is registered, you will receive a reset link shortly." }), req.headers.get("origin") || undefined);
    }

    if (user.provider && user.provider !== 'email') {
      return handleCORS(NextResponse.json({ error: `You signed up using ${user.provider}. Please log in via ${user.provider}.` }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await query("UPDATE users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3", [resetToken, expiry.toISOString(), user.id]);

    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    await sendEmail({
      to: email.toLowerCase().trim(),
      subject: "Password Reset Request - AusDrive Premium",
      html: `<p>You requested a password reset. Click the following link to reset your password. This link is valid for 1 hour.</p><a href="${resetLink}">${resetLink}</a>`,
    });

    return handleCORS(NextResponse.json({ message: "If your email is registered, you will receive a reset link shortly." }, { status: 200 }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error(err);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
