import { pool } from "./prisma";

let ensured = false;

export async function ensureBackendSchema(): Promise<void> {
  if (ensured) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT NOT NULL,
      access_token TEXT,
      device_name VARCHAR(255),
      device_type VARCHAR(50),
      ip_address VARCHAR(100),
      user_agent VARCHAR(500),
      is_active BOOLEAN NOT NULL DEFAULT TRUE,
      expires_at TIMESTAMPTZ NOT NULL,
      last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions (user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS user_sessions_active_idx ON user_sessions (is_active)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS user_sessions_expires_idx ON user_sessions (expires_at)`);

  ensured = true;
}
