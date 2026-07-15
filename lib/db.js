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

let isDbInitialized = false;

async function initDb() {
  if (isDbInitialized || !process.env.DATABASE_URL) return;
  try {
    const client = await pool.connect();
    try {
      // 1. Alter articles to add status and ai metadata if not exists
      await client.query(`
        ALTER TABLE articles 
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published',
        ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS ai_generation_id INTEGER;
      `);
      
      // 2. Create ai_feeds table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_feeds (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          url VARCHAR(500) NOT NULL UNIQUE,
          category VARCHAR(100) DEFAULT 'Famosos',
          schedule_hours VARCHAR(255) DEFAULT '08:00, 12:00, 18:00',
          timezone VARCHAR(100) DEFAULT 'America/Araguaina',
          max_items_per_run INTEGER DEFAULT 3,
          mode VARCHAR(20) DEFAULT 'draft',
          image_policy VARCHAR(50) DEFAULT 'attach',
          is_active BOOLEAN DEFAULT TRUE,
          allowed_keywords TEXT,
          blocked_keywords TEXT,
          failed_consecutive_runs INTEGER DEFAULT 0,
          last_run_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 3. Create ai_generations table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_generations (
          id SERIAL PRIMARY KEY,
          feed_id INTEGER REFERENCES ai_feeds(id) ON DELETE SET NULL,
          trigger_type VARCHAR(20) NOT NULL,
          status VARCHAR(20) NOT NULL,
          prompt_tokens INTEGER DEFAULT 0,
          completion_tokens INTEGER DEFAULT 0,
          estimated_cost NUMERIC(10, 6) DEFAULT 0,
          source_url VARCHAR(500),
          error_log TEXT,
          article_id INTEGER,
          facts_used TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // 4. Create ai_processed_items table
      await client.query(`
        CREATE TABLE IF NOT EXISTS ai_processed_items (
          id SERIAL PRIMARY KEY,
          feed_id INTEGER REFERENCES ai_feeds(id) ON DELETE CASCADE,
          item_guid VARCHAR(500) NOT NULL,
          item_link VARCHAR(500) NOT NULL,
          item_hash VARCHAR(64) NOT NULL,
          status VARCHAR(50) NOT NULL,
          article_id INTEGER,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(feed_id, item_guid),
          UNIQUE(feed_id, item_hash)
        );
      `);

      isDbInitialized = true;
      console.log('Banco de dados inicializado e tabelas migradas com sucesso.');
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Erro ao inicializar o banco de dados:', err);
  }
}

export async function query(text, params) {
  if (!process.env.DATABASE_URL) {
    console.warn('DATABASE_URL is not set. Returning empty result for build time.');
    return { rows: [] };
  }
  await initDb();
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
