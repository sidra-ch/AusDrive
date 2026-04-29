import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import crypto from "crypto";
import { sendEmail } from "@/lib/email";
import { ensureAuthSchema } from "@/lib/auth-schema";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  phone: z.string().trim().regex(/^\+?[1-9]\d{7,14}$/).optional().or(z.literal("")),
});

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    await ensureAuthSchema();

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const { success } = checkRateLimit(`register_${ip}`, 5, 60000); // 5 requests per minute
    if (!success) {
      return handleCORS(NextResponse.json({ error: "Too many requests" }, { status: 429 }), req.headers.get("origin") || undefined);
    }

    const parsed = registerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleCORS(NextResponse.json({ error: "Invalid registration details" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const { name, email, password, phone } = parsed.data;

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
      return handleCORS(NextResponse.json({ error: "Password must be at least 8 characters long, contain an uppercase letter and a number." }, { status: 400 }), req.headers.get("origin") || undefined);

    const existing = await query("SELECT id FROM users WHERE email = $1", [email.toLowerCase()]);
    if (existing.length > 0)
      return handleCORS(NextResponse.json({ error: "An account with this email already exists" }, { status: 409 }), req.headers.get("origin") || undefined);

    if (phone) {
      const existingPhone = await query("SELECT id FROM users WHERE phone = $1", [phone]);
      if (existingPhone.length > 0) {
        return handleCORS(NextResponse.json({ error: "An account with this phone already exists" }, { status: 409 }), req.headers.get("origin") || undefined);
      }
    }

    const hashed = await bcrypt.hash(password, 12);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    await query(
      `INSERT INTO users (name, email, phone, password, role, branch, is_active, provider, is_verified, verification_token)
       VALUES ($1, $2, $3, $4, 'USER', 'Sydney', TRUE, 'email', FALSE, $5)`,
      [name.trim(), email.toLowerCase().trim(), phone || null, hashed, verificationToken]
    );

    const verificationLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;

    try {
      await sendEmail({
        to: email.toLowerCase().trim(),
        subject: "Verify your AusDrive Premium account",
        html: `<h1>Welcome to AusDrive Premium!</h1><p>Please click the link below to verify your account:</p><a href="${verificationLink}">${verificationLink}</a>`,
      });
    } catch (emailError) {
      console.error("[register] verification email failed", emailError);
    }

    return handleCORS(NextResponse.json({ 
      message: "Registration successful. Please check your email to verify your account." 
    }, { status: 201 }), req.headers.get("origin") || undefined);
  } catch (err) {
    console.error("[register]", err);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
