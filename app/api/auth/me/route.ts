import { NextRequest, NextResponse } from "next/server";
import { getSession, verifyToken } from "@/lib/auth";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function GET(req: NextRequest) {
  // Support both cookie-based sessions (web) and Bearer token (mobile)
  let session = await getSession();

  if (!session) {
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      session = await verifyToken(token);
    }
  }

  if (!session) {
    return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), req.headers.get("origin") || undefined);
  }

  return handleCORS(
    NextResponse.json({ user: { id: session.sub, name: session.name, email: session.email, role: session.role, branch: session.branch } }),
    req.headers.get("origin") || undefined
  );
}
