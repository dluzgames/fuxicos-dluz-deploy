import { Pool } from 'pg';

let pool;

if (!global.pool) {
  global.pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5, // keep max connections low to avoid "too many clients already"
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

pool = global.pool;

export async function query(text, params) {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Returning empty result for build time.');
    return { rows: [] };
  }
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } catch (err) {
    console.error('Database query failed:', err.message);
    return { rows: [] };
  } finally {
    client.release();
  }
}
