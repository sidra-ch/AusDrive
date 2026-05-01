import pg from 'pg';
import { config } from 'dotenv';
config({ path: '.env.local' });
const c = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
await c.connect();
const r = await c.query(`SELECT table_name, column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('Car','User','Booking','Payment','Maintenance','AuditLog','Notification','GpsTracking','MaintenanceRecord') ORDER BY table_name, ordinal_position`);
for (const row of r.rows) { console.log(`${row.table_name}.${row.column_name} (${row.udt_name})`); }
const t = await c.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name`);
console.log('\nALL TABLES:', t.rows.map(r=>r.table_name).join(', '));
await c.end();
