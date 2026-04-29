import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

const sendOtpSchema = z.object({
  phone: z.string().trim().transform((val) => val.replace(/\s+/g, "")).pipe(
    z.string().regex(/^\+?[1-9]\d{7,14}$/)
  ),
  channel: z.enum(["sms", "whatsapp"]).default("sms").optional(),
});

function normalizePhone(raw: string): string {
  const trimmed = raw.trim();
  return trimmed.startsWith("+") ? trimmed : `+${trimmed}`;
}

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function POST(req: NextRequest) {
  try {
    const parsed = sendOtpSchema.safeParse(await req.json());
    if (!parsed.success) {
      return handleCORS(NextResponse.json({ error: "Valid phone is required" }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const phone = normalizePhone(parsed.data.phone);

    // OTP anti-spam controls
    const ipRate = checkRateLimit(`otp_send_ip_${ip}`, 8, 60_000);
    const phoneRate = checkRateLimit(`otp_send_phone_${phone}`, 3, 60_000);
    if (!ipRate.success || !phoneRate.success) {
      return handleCORS(NextResponse.json({ error: "Too many OTP requests. Please try again later." }, { status: 429 }), req.headers.get("origin") || undefined);
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

    if (!accountSid || !authToken || !verifyServiceSid) {
      return handleCORS(NextResponse.json({ error: "Twilio Verify is not configured" }, { status: 500 }), req.headers.get("origin") || undefined);
    }

    const channel = parsed.data.channel ?? "sms";

    const response = await fetch(
      `https://verify.twilio.com/v2/Services/${verifyServiceSid}/Verifications`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
        body: new URLSearchParams({
          To: phone,
          Channel: channel,
        }).toString(),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[auth/send-otp] Twilio verify error", errorText);
      try {
        const twilioError = JSON.parse(errorText) as { code?: number; message?: string };
        if (twilioError.code === 21608) {
          return handleCORS(
            NextResponse.json(
              {
                error: "Twilio trial account can only send OTP to verified destination numbers. Please verify this number in Twilio Console.",
              },
              { status: 400 },
            ),
            req.headers.get("origin") || undefined,
          );
        }
      } catch {
        // fall through to generic message
      }

      return handleCORS(NextResponse.json({ error: "Failed to send OTP. Please check Twilio Verify setup." }, { status: 400 }), req.headers.get("origin") || undefined);
    }

    const data = await response.json();
    return handleCORS(
      NextResponse.json({
        success: true,
        status: data.status,
        to: data.to,
        channel: data.channel,
      }),
      req.headers.get("origin") || undefined,
    );
  } catch (error) {
    console.error("[auth/send-otp]", error);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
