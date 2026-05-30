import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const resetDatabase = async () => {
  try {
    const resetPath = path.join(__dirname, '../../database/reset.sql');
    const sql = fs.readFileSync(resetPath, 'utf8');

    await pool.query(sql);
    console.log('✓ All tables dropped. Run: npm run db:setup');
    process.exit(0);
  } catch (error) {
    console.error('Reset failed:', error.message);
    process.exit(1);
  }
};

resetDatabase();
