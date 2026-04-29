import { query } from "@/lib/db";

let ensured = false;
let ensurePromise: Promise<void> | null = null;

export async function ensureAuthSchema(): Promise<void> {
  if (ensured) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    // Keep compatibility with existing users table while adding production auth fields.
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_sub TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ`);

    await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users ((lower(email)))`);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx ON users (phone) WHERE phone IS NOT NULL`);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique_idx ON users (google_id) WHERE google_id IS NOT NULL`);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_apple_sub_unique_idx ON users (apple_sub) WHERE apple_sub IS NOT NULL`);

    ensured = true;
  })();

  try {
    await ensurePromise;
  } finally {
    ensurePromise = null;
  }
}
