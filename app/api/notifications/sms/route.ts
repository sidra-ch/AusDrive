import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { to, message } = await req.json();
    
    if (!to || !message) {
      return NextResponse.json({ error: "Missing to or message" }, { status: 400 });
    }

    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromNumber) {
      return NextResponse.json({ error: "Twilio not configured" }, { status: 400 });
    }

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
          From: fromNumber,
          To: to,
          Body: message,
        }).toString(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Twilio error:", error);
      return NextResponse.json({ error: "Failed to send SMS" }, { status: 400 });
    }

    const data = await response.json();
    return NextResponse.json({ success: true, sid: data.sid });
  } catch (error) {
    console.error("SMS error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
