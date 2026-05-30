import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Split SQL file into statements (handles $$ ... $$ blocks)
 */
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inDollarQuote = false;
  let dollarTag = '';

  const lines = sql.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip full-line comments
    if (!inDollarQuote && trimmed.startsWith('--')) {
      continue;
    }

    // Detect start/end of dollar-quoted strings ($$, $tag$, etc.)
    if (!inDollarQuote) {
      const dollarMatch = line.match(/\$([a-zA-Z_]*)\$/);
      if (dollarMatch) {
        dollarTag = dollarMatch[0];
        const rest = line.split(dollarTag).slice(1).join(dollarTag);
        if (!rest.includes(dollarTag)) {
          inDollarQuote = true;
        }
      }
    } else if (line.includes(dollarTag)) {
      inDollarQuote = false;
      dollarTag = '';
    }

    current += `${line}\n`;

    if (!inDollarQuote && line.trim().endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 0) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  const remainder = current.trim();
  if (remainder.length > 0) {
    statements.push(remainder);
  }

  return statements.filter((s) => s.length > 0);
}

const setupDatabase = async () => {
  const client = await pool.connect();

  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    const statements = splitSqlStatements(schema);

    console.log(`Applying ${statements.length} SQL statements...\n`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      const preview = stmt.replace(/\s+/g, ' ').substring(0, 70);
      try {
        await client.query(stmt);
        console.log(`  ✓ [${i + 1}/${statements.length}] ${preview}...`);
      } catch (error) {
        console.error(`\n  ✗ Failed on statement [${i + 1}]:`);
        console.error(`    ${preview}...`);
        console.error(`    Error: ${error.message}\n`);
        throw error;
      }
    }

    console.log('\n✓ Database schema applied successfully');

    const adminEmail = 'admin@facescane.com';
    const checkAdmin = await client.query('SELECT id FROM users WHERE email = $1', [adminEmail]);

    if (checkAdmin.rows.length === 0) {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.default.hash('Admin@123456', 12);

      await client.query(
        `INSERT INTO users (name, email, password_hash, role, email_verified)
         VALUES ($1, $2, $3, 'admin', true)`,
        ['System Admin', adminEmail, passwordHash]
      );
      console.log('✓ Default admin created: admin@facescane.com / Admin@123456');
    } else {
      console.log('✓ Admin user already exists');
    }

    const tables = await client.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    console.log('\nTables in database:', tables.rows.map((r) => r.table_name).join(', '));
  } catch (error) {
    console.error('\nDatabase setup failed:', error.message);
    console.error('\nTry running reset.sql first, then schema.sql again.');
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
};

setupDatabase();
