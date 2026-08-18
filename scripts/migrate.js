#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const conn = process.env.NEON_DATABASE_URL || process.env.DATABASE_URL;
  if (!conn) {
    console.error('DATABASE_URL is required');
    process.exitCode = 1;
    return;
  }
  const sqlPath = path.join(__dirname, '..', 'migrations', 'create_tables.sql');
  const sql = fs.readFileSync(sqlPath, 'utf8');
  const client = new Client({ connectionString: conn });
  try {
    await client.connect();
    await client.query(sql);
    console.log('Migration completed');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await client.end();
  }
}
main();
