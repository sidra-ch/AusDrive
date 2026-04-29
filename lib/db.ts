import { Pool, PoolConfig } from "pg";

// Don't cache pool at all - create fresh connection each time
let currentPool: Pool | null = null;

function getPool(): Pool {
  // Always close and recreate pool to avoid stale connections
  if (currentPool) {
    currentPool.end().catch(() => {});
    currentPool = null;
  }

  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not defined");
  }

  const isLocalDb = dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1');

  const poolConfig: PoolConfig = {
    connectionString: dbUrl,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  };

  if (!isLocalDb) {
    poolConfig.ssl = { rejectUnauthorized: false };
  }

  const timestamp = new Date().toISOString();
  console.log(`[DB ${timestamp}] Creating NEW pool - Type: ${isLocalDb ? 'LOCAL' : 'REMOTE'}`);
  console.log(`[DB ${timestamp}] Database: ${dbUrl.split('@')[1]?.split('?')[0]}`);
  
  currentPool = new Pool(poolConfig);
  return currentPool;
}

export const db = getPool();

export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T[]> {
  try {
    // Get fresh pool for each query
    const pool = getPool();
    const result = await pool.query(sql, params);
    return result.rows as T[];
  } catch (error) {
    console.error('[DB] Query error:', error);
    console.error('[DB] SQL:', sql);
    console.error('[DB] Params:', params);
    throw error;
  }
}

export async function queryOne<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}
