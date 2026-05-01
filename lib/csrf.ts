import type { NextRequest, NextFetchEvent } from 'next/server';
import { NextResponse } from 'next/server';
import Csrf from 'csrf';

const csrfTokens = new Csrf();

const SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'ausdrive_csrf_secret_2025';

export function getCsrfToken(): string {
  return csrfTokens.secretSync();
}

export function createCsrfToken(secret: string): string {
  return csrfTokens.create(secret);
}

export function verifyCsrfToken(secret: string, token: string): boolean {
  return csrfTokens.verify(secret, token);
}

export async function csrfMiddleware(req: NextRequest, res: NextResponse): Promise<boolean> {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return true;
  }

  const csrfToken = req.headers.get('x-csrf-token');
  const cookieToken = req.cookies.get('csrf_token')?.value;

  if (!csrfToken || !cookieToken) {
    return false;
  }

  return verifyCsrfToken(cookieToken, csrfToken);
}

export function setCsrfCookie(res: NextResponse, secret: string): void {
  const token = csrfTokens.secretSync();
  res.cookies.set('csrf_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24,
  });
}
