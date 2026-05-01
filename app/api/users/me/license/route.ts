import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { query } from "@/lib/db";
import { handleCORS, handleOPTIONS } from "@/lib/cors";

export async function OPTIONS(req: NextRequest) {
  return handleOPTIONS(req.headers.get("origin") || undefined);
}

export async function PUT(req: NextRequest) {
  try {
    const origin = req.headers.get("origin") || undefined;
    const session = await getSession();
    
    if (!session) {
      return handleCORS(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), origin);
    }

    const body = await req.json();
    const { licenceUrl } = body;

    if (!licenceUrl) {
      return handleCORS(NextResponse.json({ error: "licenceUrl is required" }, { status: 400 }), origin);
    }

    // Check if the user is a customer, otherwise create/update the customer record linked to the user
    // First find the user's email to lookup customer
    const users = await query(`SELECT email FROM users WHERE id = $1`, [session.sub]);
    
    if (users.length === 0) {
      return handleCORS(NextResponse.json({ error: "User not found" }, { status: 404 }), origin);
    }
    
    const email = users[0].email;

    // Check if customer exists
    const customers = await query(`SELECT id FROM customers WHERE email = $1`, [email]);
    
    if (customers.length > 0) {
      // Update existing customer
      await query(
        `UPDATE customers SET licence_url = $1, is_verified = false, updated_at = NOW() WHERE email = $2`,
        [licenceUrl, email]
      );
    } else {
      // For simplicity, we just save it back to the user if no customer record.
      // Alternatively, insert into customers.
      await query(
        `INSERT INTO customers (name, email, licence_url, is_verified, created_at, updated_at) 
         VALUES ($1, $2, $3, false, NOW(), NOW())`,
        [session.name || "Unknown", email, licenceUrl]
      );
    }

    return handleCORS(NextResponse.json({ success: true, message: "License uploaded successfully." }), origin);

  } catch (error) {
    console.error("[api/users/me/license]", error);
    return handleCORS(NextResponse.json({ error: "Server error" }, { status: 500 }), req.headers.get("origin") || undefined);
  }
}
