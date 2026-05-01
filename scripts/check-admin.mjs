import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await client.connect();
const r = await client.query('SELECT id, email, role, is_active, (password IS NOT NULL) as has_password FROM users ORDER BY role');
console.table(r.rows);
await client.end();
