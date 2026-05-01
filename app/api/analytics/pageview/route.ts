import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { ensureAuthSchema } from "@/lib/auth-schema";

export async function POST(req: NextRequest) {
  try {
    await ensureAuthSchema();

    const { path } = await req.json();
    const ip = req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "";
    const ref = req.headers.get("referer") ?? "";
    await query(
      "INSERT INTO page_views (path, ip_address, user_agent, referrer) VALUES ($1,$2,$3,$4)",
      [path, ip, ua, ref]
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
