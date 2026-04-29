import { NextRequest, NextResponse } from "next/server";

function normalizeWhatsappNumber(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("whatsapp:")) return trimmed;
  return `whatsapp:${trimmed}`;
}

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return NextResponse.json({ error: "Missing to or message" }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: "Twilio WhatsApp not configured" }, { status: 400 });
    }

    const from = normalizeWhatsappNumber(fromNumber);
    const destination = normalizeWhatsappNumber(String(to));

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization:
            "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        },
        body: new URLSearchParams({
          From: from,
          To: destination,
          Body: String(message),
        }).toString(),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Twilio WhatsApp error:", errorText);
      return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 400 });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, sid: data.sid });
  } catch (error) {
    console.error("WhatsApp route error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
