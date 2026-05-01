/**
 * seed-admin.mjs
 * Promotes an existing user to SUPER_ADMIN and sets a bcrypt password,
 * OR inserts a new admin user if the email doesn't exist.
 *
 * Usage:
 *   node scripts/seed-admin.mjs <email> <password>
 *   node scripts/seed-admin.mjs admin@ausdrive.com.au "Str0ng!Pass#2026"
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config({ path: '.env.local' });

const [, , email, plainPassword] = process.argv;

if (!email || !plainPassword) {
  console.error('Usage: node scripts/seed-admin.mjs <email> <password>');
  process.exit(1);
}

const MIN_PW_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
if (!MIN_PW_RE.test(plainPassword)) {
  console.error('Password must be ≥8 chars with upper, lower, digit and symbol.');
  process.exit(1);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

await client.connect();

const hash = await bcrypt.hash(plainPassword, 12);
const normalizedEmail = email.toLowerCase().trim();

const existing = await client.query('SELECT id, email, role FROM users WHERE email = $1', [normalizedEmail]);

if (existing.rows.length > 0) {
  const user = existing.rows[0];
  await client.query(
    "UPDATE users SET role = 'SUPER_ADMIN', password = $1, is_active = true WHERE email = $2",
    [hash, normalizedEmail],
  );
  console.log(`✅ Updated existing user (id=${user.id}) → role=SUPER_ADMIN, password set`);
} else {
  const res = await client.query(
    "INSERT INTO users (name, email, password, role, is_active) VALUES ($1, $2, $3, 'SUPER_ADMIN', true) RETURNING id",
    ['Admin', normalizedEmail, hash],
  );
  console.log(`✅ Created new SUPER_ADMIN user (id=${res.rows[0].id})`);
}

await client.end();
console.log(`\nAdmin email:    ${normalizedEmail}`);
console.log(`Login at:       /admin/login  (dashboard)`);
