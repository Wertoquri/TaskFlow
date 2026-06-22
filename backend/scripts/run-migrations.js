const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });
const { nativePool } = require('../db');

async function main() {
  const filePath = path.join(__dirname, '..', 'migrations', '000_initial_schema.sql');
  await nativePool.query(fs.readFileSync(filePath, 'utf8'));
  console.log('Applied migration: 000_initial_schema.sql');
  await nativePool.end();
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
