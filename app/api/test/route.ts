import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    const result = await query("SELECT NOW() as current_time, version() as pg_version");
    
    // Test users table
    const userCount = await query("SELECT COUNT(*) as count FROM users");
    
    return NextResponse.json({
      status: "ok",
      database: {
        connected: true,
        time: result[0],
        userCount: userCount[0],
      },
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
