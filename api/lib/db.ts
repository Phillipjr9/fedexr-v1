import { Client } from 'pg';

export function dbUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.fedex_DATABASE_URL ||
    process.env.fedex_POSTGRES_URL ||
    process.env.fedex_POSTGRES_PRISMA_URL ||
    ''
  );
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

export function adminUsername() {
  return (process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin').trim();
}

export function adminPassword() {
  return (process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin').trim();
}

export function isAdminUser(username: string, password: string) {
  return String(username || '').trim().toLowerCase() === adminUsername().toLowerCase() && String(password || '') === adminPassword();
}

export function isAdmin(req: { headers?: Record<string, string | string[] | undefined> }) {
  const expectedPass = adminPassword();
  const header = req.headers?.['x-admin-secret'] || req.headers?.['X-Admin-Secret'];
  const value = Array.isArray(header) ? header[0] : header;
  return String(value || '') === expectedPass;
}
