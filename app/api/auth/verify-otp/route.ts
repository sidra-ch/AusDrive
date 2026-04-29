import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";
import { ensureAuthSchema } from "@/lib/auth-schema";
import { query, queryOne } from "@/lib/db";
import { getRefreshExpiryDate, hashToken, issueTokenPair, setAuthCookies } from "@/lib/auth";

const verifyOtpSchema = z.object({
  phone: z.string().trim().transform((val) => val.replace(/\s+/g, "")).pipe(
    z.string().regex(/^\+?[1-9]\d{7,14}$/)
  ),
  code: z.string().trim().regex(/^\d{4,8}$/),
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
});

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  branch: string | null;
};

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

function placeholderEmailForPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `phone_${digits}@otp.ausdrive.local`;
}

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    await ensureAuthSchema();

    const parsed = verifyOtpSchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleCORS(NextResponse.json({ error: "Phone and OTP code are required" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const phone = normalizePhone(parsed.data.phone);

    const ipRate = checkRateLimit(`otp_verify_ip_${ip}`, 12, 60_000);
    const phoneRate = checkRateLimit(`otp_verify_phone_${phone}`, 6, 60_000);
    if (!ipRate.success || !phoneRate.success) {
      return handleCORS(NextResponse.json({ error: "Too many OTP attempts. Please wait and try again." }, { status: 429 }), req.headers.get("origin") || undefined);
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifyServiceSid) {
      return handleCORS(NextResponse.json({ error: "Twilio Verify is not configured" }, { status: 500 }), req.headers.get("origin") || undefined);
    }

    const verifyResponse = await fetch(
      `https://verify.twilio.com/v2/Services/${verifyServiceSid}/VerificationCheck`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
        body: new URLSearchParams({
          To: phone,
          Code: parsed.data.code,
        }).toString(),
      },
    );

    if (!verifyResponse.ok) {
      const errorText = await verifyResponse.text();
      console.error("[auth/verify-otp] Twilio verify check error", errorText);
      try {
        const twilioError = JSON.parse(errorText) as { code?: number };
        if (twilioError.code === 20404) {
          return handleCORS(
            NextResponse.json(
              { error: "Twilio Verify Service SID is invalid or not found. Please check TWILIO_VERIFY_SERVICE_SID." },
              { status: 400 },
            ),
            req.headers.get("origin") || undefined,
          );
        }
      } catch {
        // fall through to generic message
      }

      return handleCORS(NextResponse.json({ error: "Invalid OTP" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const verifyData = await verifyResponse.json();
    if (verifyData.status !== "approved") {
      return handleCORS(NextResponse.json({ error: "OTP verification failed" }, { status: 401 }), req.headers.get("origin") || undefined);
    }

    const normalizedEmail = parsed.data.email?.toLowerCase();
    const fallbackEmail = placeholderEmailForPhone(phone);

    let user = await queryOne<UserRow>("SELECT id, name, email, role, branch FROM users WHERE phone = $1 LIMIT 1", [phone]);

    if (!user && normalizedEmail) {
      user = await queryOne<UserRow>("SELECT id, name, email, role, branch FROM users WHERE lower(email) = $1 LIMIT 1", [normalizedEmail]);
      if (user) {
        await query(
          "UPDATE users SET phone = $1, provider = 'phone_otp', is_verified = TRUE, last_login = NOW() WHERE id = $2",
          [phone, user.id],
        );
      }
    }

    if (!user) {
      const inserted = await query<UserRow>(
        `INSERT INTO users (name, email, phone, password, role, branch, is_active, provider, is_verified)
         VALUES ($1, $2, $3, NULL, 'USER', 'Sydney', TRUE, 'phone_otp', TRUE)
         RETURNING id, name, email, role, branch`,
        [parsed.data.name?.trim() || "Phone User", normalizedEmail || fallbackEmail, phone],
      );
      user = inserted[0];
    }

    await query("UPDATE users SET last_login = NOW() WHERE id = $1", [user.id]);

    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      branch: user.branch,
    };

    const { accessToken, refreshToken } = await issueTokenPair(payload);
    await query(
      "UPDATE users SET refresh_token_hash = $1, refresh_token_expires_at = $2 WHERE id = $3",
      [hashToken(refreshToken), getRefreshExpiryDate(), user.id],
    );

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        branch: user.branch,
      },
      token: accessToken,
      accessToken,
      refreshToken,
    });

    setAuthCookies(res, accessToken, refreshToken);
    return handleCORS(res, req.headers.get("origin") || undefined);
  } catch (error) {
    console.error("[auth/verify-otp]", error);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
