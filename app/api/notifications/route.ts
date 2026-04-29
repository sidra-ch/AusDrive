import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const notifications = await query(
    "SELECT * FROM notifications WHERE user_id = $1 OR user_id IS NULL ORDER BY created_at DESC LIMIT 50",
    [session.sub]
  );
  return NextResponse.json({ notifications });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { user_id, type, title, message } = await req.json();
  const result = await query(
    "INSERT INTO notifications (user_id, type, title, message) VALUES ($1,$2,$3,$4) RETURNING *",
    [user_id ?? session.sub, type, title, message]
  );
  return NextResponse.json({ notification: result[0] }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await query("UPDATE notifications SET is_read = TRUE WHERE id = $1", [id]);
  return NextResponse.json({ success: true });
}
