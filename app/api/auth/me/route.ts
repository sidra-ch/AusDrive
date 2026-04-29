import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";
import { isAdminRole } from "@/lib/admin-auth";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  if (!isAdminRole(session.role)) {
    return handleCORS(NextResponse.json({ error: "Forbidden" }, { status: 403 }), req.headers.get("origin") || undefined);
  }
  return handleCORS(NextResponse.json({ user: session }), req.headers.get("origin") || undefined);
}
