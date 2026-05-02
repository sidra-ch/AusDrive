import { NextResponse } from "next/server";

export function getCORSHeaders(origin?: string) {
  // Allow localhost origins for development
  const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:8082",
    "http://localhost:8081",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:8082",
    "http://127.0.0.1:8081",
  ];

  const requestOrigin = origin || "";
  const allowOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : "http://localhost:8082";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export function handleCORS(response: NextResponse, origin?: string): NextResponse {
  const headers = getCORSHeaders(origin);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

export function handleOPTIONS(origin?: string): NextResponse {
  const headers = getCORSHeaders(origin);
  return new NextResponse(null, {
    status: 200,
    headers,
  });
}
