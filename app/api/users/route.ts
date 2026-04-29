import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { query } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const users = await query("SELECT id, name, email, role, branch, is_active, last_login, created_at FROM users ORDER BY created_at DESC");
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !["SUPER_ADMIN", "ADMIN"].includes(session.role))
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { name, email, password, role, branch } = await req.json();
  if (!name || !email || !password) return NextResponse.json({ error: "Required fields missing" }, { status: 400 });
  const hashed = await bcrypt.hash(password, 10);
  const result = await query(
    "INSERT INTO users (name, email, password, role, branch) VALUES ($1,$2,$3,$4,$5) RETURNING id, name, email, role, branch",
    [name, email, hashed, role ?? "STAFF", branch ?? "Sydney"]
  );
  return NextResponse.json({ user: result[0] }, { status: 201 });
}
