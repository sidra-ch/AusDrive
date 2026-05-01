import { config } from "dotenv";
import pkg from "pg";
config({ path: ".env.local" });
const { Pool } = pkg;
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const r1 = await p.query('SELECT COUNT(*) FROM "GPSLog"');
console.log("GPSLog entries:", r1.rows[0].count);

const r2 = await p.query('SELECT COUNT(*) FROM "Car"');
console.log("Total cars:", r2.rows[0].count);

await p.end();


