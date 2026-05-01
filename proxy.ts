import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const accessSecret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "ausdrive_super_secret_jwt_key_2025",
);

const ADMIN_ROLES = new Set(["ADMIN", "SUPER_ADMIN"]);
const STAFF_ROLES = new Set(["ADMIN", "SUPER_ADMIN", "STAFF"]);

const protectedPagePrefixes = ["/dashboard"];
const protectedApiPrefixes = [
  "/api/dashboard",
  "/api/users",
  "/api/reports",
  "/api/bookings",
  "/api/customers",
  "/api/cars/import",
  "/api/maintenance",
  "/api/payments",
  "/api/rentals",
  "/api/settings",
  "/api/audit-logs",
  "/api/notifications",
];

const staffOnlyPaths = ["/dashboard", "/api/dashboard", "/api/reports"];
const adminOnlyPaths = ["/dashboard/users", "/dashboard/settings", "/api/users", "/api/settings", "/api/audit-logs"];

type TokenClaims = {
  sub?: string;
  role?: string;
  tokenType?: string;
};

async function verifyAccessToken(token: string): Promise<TokenClaims | null> {
  try {
    const { payload } = await jwtVerify(token, accessSecret);
    const tokenType = payload.tokenType as string | undefined;
    if (tokenType && tokenType !== "access") return null;
    return payload as unknown as TokenClaims;
  } catch {
    return null;
  }
}

function isProtectedPath(pathname: string): boolean {
  return (
    protectedPagePrefixes.some((prefix) => pathname.startsWith(prefix)) ||
    protectedApiPrefixes.some((prefix) => pathname.startsWith(prefix))
  );
}

function requiresStaff(pathname: string): boolean {
  return staffOnlyPaths.some((prefix) => pathname.startsWith(prefix));
}

function requiresAdmin(pathname: string): boolean {
  return adminOnlyPaths.some((prefix) => pathname.startsWith(prefix));
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!isProtectedPath(pathname)) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth_token")?.value;
  const claims = token ? await verifyAccessToken(token) : null;

  if (!claims?.sub) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const role = String(claims.role ?? "USER").toUpperCase();

  if (requiresAdmin(pathname) && !ADMIN_ROLES.has(role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (requiresStaff(pathname) && !STAFF_ROLES.has(role)) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};