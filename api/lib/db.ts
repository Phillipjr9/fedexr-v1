import { Client } from 'pg';

export function dbUrl() {
  return process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

export async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const connectionString = dbUrl();
  if (!connectionString) throw new Error('No database connection configured');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export function isAdmin(req: { headers?: Record<string, string | string[] | undefined> }) {
  const secret = process.env.ADMIN_SECRET || process.env.adminPassword || 'admin';
  const header = req.headers?.['x-admin-secret'] || req.headers?.['X-Admin-Secret'];
  const value = Array.isArray(header) ? header[0] : header;
  return value === secret;
}
