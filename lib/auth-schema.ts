import { query } from "@/lib/db";

let ensured = false;
let ensurePromise: Promise<void> | null = null;

export async function ensureAuthSchema(): Promise<void> {
  if (ensured) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    // Fresh database bootstrap: create core auth + analytics tables if missing.
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        password TEXT,
        phone VARCHAR(32),
        role TEXT NOT NULL DEFAULT 'USER',
        branch TEXT NOT NULL DEFAULT 'Sydney',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        provider TEXT NOT NULL DEFAULT 'email',
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        verification_token TEXT,
        reset_token TEXT,
        reset_token_expiry TIMESTAMPTZ,
        google_id TEXT,
        apple_sub TEXT,
        profile_image TEXT,
        refresh_token_hash TEXT,
        refresh_token_expires_at TIMESTAMPTZ,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    await query(`
      CREATE TABLE IF NOT EXISTS page_views (
        id BIGSERIAL PRIMARY KEY,
        path TEXT NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        referrer TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Keep compatibility with existing users table while adding production auth fields.
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(32)`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS apple_sub TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_hash TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMPTZ`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'email'`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'USER'`);
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS branch TEXT DEFAULT 'Sydney'`);

    await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_idx ON users ((lower(email)))`);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_phone_unique_idx ON users (phone) WHERE phone IS NOT NULL`);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique_idx ON users (google_id) WHERE google_id IS NOT NULL`);
    await query(`CREATE UNIQUE INDEX IF NOT EXISTS users_apple_sub_unique_idx ON users (apple_sub) WHERE apple_sub IS NOT NULL`);
    await query(`CREATE INDEX IF NOT EXISTS page_views_created_at_idx ON page_views (created_at)`);

    ensured = true;
  })();

  try {
    await ensurePromise;
  } finally {
    ensurePromise = null;
  }
}
