import { NextRequest, NextResponse } from "next/server";
export { OPTIONS, POST } from "@/app/api/auth/admin/login/route";

export async function GET(req: NextRequest) {
	return NextResponse.redirect(new URL("/admin/login", req.url));
}
