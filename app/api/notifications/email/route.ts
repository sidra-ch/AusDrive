import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { to, templateId, dynamicTemplateData } = await req.json();
    
    if (!to || !templateId) {
      return NextResponse.json({ error: "Missing to or templateId" }, { status: 400 });
    }

    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "SendGrid not configured" }, { status: 400 });
    }

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: {
          email: "noreply@ausdrive.com.au",
          name: "AusDrive Premium",
        },
        personalizations: [
          {
            to: [{ email: to }],
            dynamic_template_data: dynamicTemplateData || {},
          },
        ],
        template_id: templateId,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("SendGrid error:", error);
      return NextResponse.json({ error: "Failed to send email" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Email error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
