import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";

// Ensure DATABASE_URL is available even when running backend from mobile-app/backend.
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env.local") });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set for mobile backend.");
}

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("localhost") ? false : { rejectUnauthorized: false },
});
