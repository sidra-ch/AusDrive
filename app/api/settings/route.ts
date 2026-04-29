import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Settings are stored as key-value pairs in a settings table.
// We create the table on first access if it doesn't exist.
async function ensureTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      key   VARCHAR(100) PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}

const DEFAULT_SETTINGS: Record<string, string> = {
  base_daily_rate: "29",
  weekend_surcharge_pct: "15",
  late_fee_per_day: "25",
  security_deposit: "500",
  young_driver_surcharge: "20",
  branch_name: "Sydney CBD",
  branch_address: "123 George St, Sydney NSW 2000",
  branch_phone: "+61 2 9000 0000",
  branch_email: "sydney@ausdrive.com.au",
  gps_tracking_enabled: "true",
  stripe_payments_enabled: "true",
  email_notifications_enabled: "false",
  sms_notifications_enabled: "false",
  auto_overdue_check_enabled: "true",
};

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await ensureTable();

  const rows = await query<{ key: string; value: string }>("SELECT key, value FROM settings");
  const settings: Record<string, string> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    settings[row.key] = row.value;
  }

  return NextResponse.json({ settings });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  await ensureTable();

  // Upsert each setting key
  for (const [key, value] of Object.entries(body)) {
    if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") continue;
    await query(
      `INSERT INTO settings (key, value, updated_at) VALUES ($1, $2, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, String(value)]
    );
  }

  await query(
    "INSERT INTO audit_logs (user_id, user_name, action, module) VALUES ($1,$2,$3,$4)",
    [session.sub, session.name, "Updated platform settings", "Settings"]
  );

  return NextResponse.json({ success: true });
}
