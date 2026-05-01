import { config } from "dotenv";
import pkg from "pg";
config({ path: ".env.local" });
const { Pool } = pkg;
const p = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const r1 = await p.query('SELECT COUNT(*) FROM "Car" WHERE latitude IS NOT NULL');
console.log("Cars with lat/lng:", r1.rows[0].count);

const r2 = await p.query('SELECT make, model, latitude, longitude FROM "Car" WHERE latitude IS NOT NULL LIMIT 5');
console.log("Sample GPS cars:", JSON.stringify(r2.rows));

const r3 = await p.query('SELECT COUNT(*) FROM "GPSLog"');
console.log("GPSLog entries:", r3.rows[0].count);

await p.end();
