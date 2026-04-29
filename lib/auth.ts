import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const accessSecret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "ausdrive_super_secret_jwt_key_2025"
);
const refreshSecret = new TextEncoder().encode(
  process.env.JWT_REFRESH_SECRET ?? process.env.JWT_SECRET ?? "ausdrive_refresh_secret_2025"
);

export const AUTH_COOKIE_NAME = "auth_token";
export const REFRESH_COOKIE_NAME = "refresh_token";
export const ACCESS_TOKEN_TTL = "15m";
export const REFRESH_TOKEN_TTL = "30d";

export type JWTPayload = {
  sub: number;
  name: string;
  email: string;
  role: string;
  branch?: string | null;
  tokenType?: "access" | "refresh";
};

async function signJwt(
  payload: JWTPayload,
  secret: Uint8Array,
  expiresIn: string,
  tokenType: "access" | "refresh",
): Promise<string> {
  return new SignJWT({ ...payload, sub: String(payload.sub), tokenType } as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(secret);
}

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return signJwt(payload, accessSecret, ACCESS_TOKEN_TTL, "access");
}

export async function signRefreshToken(payload: JWTPayload): Promise<string> {
  return signJwt(payload, refreshSecret, REFRESH_TOKEN_TTL, "refresh");
}

// Backward-compatible alias for existing routes.
export async function signToken(payload: JWTPayload): Promise<string> {
  return signAccessToken(payload);
}

async function verifyJwt(
  token: string,
  secret: Uint8Array,
  expectedType: "access" | "refresh",
): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    const tokenType = payload.tokenType as string | undefined;

    if (tokenType && tokenType !== expectedType) return null;

    return {
      sub: Number(payload.sub),
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: String(payload.role ?? "USER"),
      branch: payload.branch ? String(payload.branch) : null,
      tokenType: expectedType,
    };
  } catch {
    return null;
  }
}

export async function verifyAccessToken(token: string): Promise<JWTPayload | null> {
  return verifyJwt(token, accessSecret, "access");
}

export async function verifyRefreshToken(token: string): Promise<JWTPayload | null> {
  return verifyJwt(token, refreshSecret, "refresh");
}

// Backward-compatible alias for existing imports.
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  return verifyAccessToken(token);
}

export async function issueTokenPair(payload: JWTPayload): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const [accessToken, refreshToken] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  return { accessToken, refreshToken };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function getRefreshExpiryDate(days = 30): Date {
  const expires = new Date();
  expires.setDate(expires.getDate() + days);
  return expires;
}

export function setAuthCookies(response: NextResponse, accessToken: string, refreshToken: string): void {
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set(AUTH_COOKIE_NAME, accessToken, {
    ...common,
    maxAge: 60 * 15,
  });

  response.cookies.set(REFRESH_COOKIE_NAME, refreshToken, {
    ...common,
    maxAge: 60 * 60 * 24 * 30,
  });
}

export function clearAuthCookies(response: NextResponse): void {
  const common = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires: new Date(0),
  };

  response.cookies.set(AUTH_COOKIE_NAME, "", common);
  response.cookies.set(REFRESH_COOKIE_NAME, "", common);
}

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}
