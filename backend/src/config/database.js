import pg from 'pg';
import config from './index.js';

const { Pool } = pg;

if (!config.database) {
  throw new Error(
    'Database configuration missing. Add to backend/.env either:\n' +
    '  DATABASE_URL=postgresql://user:password@localhost:5432/facescane_auth\n' +
    'or:\n' +
    '  DB_HOST=localhost\n  DB_PORT=5432\n  DB_USER=postgres\n  DB_PASSWORD=yourpassword\n  DB_NAME=facescane_auth'
  );
}

const pool = new Pool({
  ...config.database,
  ssl: config.env === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL pool error:', err);
});

/**
 * Execute a parameterized query (SQL injection safe)
 */
export const query = async (text, params = []) => {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  if (config.env === 'development') {
    console.log('Query executed', { text: text.substring(0, 80), duration, rows: result.rowCount });
  }

  return result;
};

export const getClient = () => pool.connect();

export default pool;
