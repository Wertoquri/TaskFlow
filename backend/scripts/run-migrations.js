const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
// Load env from backend root explicitly to avoid cwd issues
const dotenv = require('dotenv');
// Try backend/.env then repo root .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
// Fallback to db.js config if env is missing
let fallbackConfig = {};
try {
  ({ dbConfig: fallbackConfig } = require('../db'));
} catch {}

async function runSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf8');
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || fallbackConfig.host,
    user: process.env.DB_USER || fallbackConfig.user,
    password: process.env.DB_PASSWORD || fallbackConfig.password,
    database: process.env.DB_NAME || fallbackConfig.database,
    multipleStatements: true,
  });
  try {
    await conn.query(sql);
    console.log(`Applied migration: ${path.basename(filePath)}`);
  } finally {
    await conn.end();
  }
}

async function main() {
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = ['000_initial_schema.sql'];
  for (const f of files) {
    const full = path.join(migrationsDir, f);
    if (fs.existsSync(full)) {
      await runSqlFile(full);
    } else {
      console.warn(`Migration file not found: ${full}`);
    }
  }
  console.log('Migrations completed.');
}

main().catch((e) => { console.error('Migration failed:', e); process.exit(1); });
