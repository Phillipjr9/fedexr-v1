function dbUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.fedex_DATABASE_URL ||
    process.env.fedex_POSTGRES_URL ||
    ''
  );
}

async function withDb<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const connectionString = dbUrl();
  if (!connectionString) throw new Error('No database connection configured');
  const { Client } = await import('pg');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

function parseBody(req: any) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

async function ensureSchema(c: any) {
  await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_email TEXT');
  await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS notify_enabled BOOLEAN DEFAULT false');
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === 'POST') {
      const body = parseBody(req);
      const number = String(body.number || body.trackingNumber || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const enable = body.enable !== false && body.enable !== 'false';

      if (!number) return res.status(400).json({ error: 'Tracking number required' });
      if (enable && (!email || !email.includes('@'))) {
        return res.status(400).json({ error: 'Enter a valid email address' });
      }

      const result = await withDb(async (c) => {
        await ensureSchema(c);
        const ship = await c.query(
          'SELECT tracking_number FROM shipments WHERE lower(tracking_number) = lower($1) LIMIT 1',
          [number]
        );
        if (!ship.rowCount) throw new Error('Shipment not found');

        if (!enable) {
          await c.query(
            `UPDATE shipments SET notify_enabled = false, updated_at = now()
             WHERE lower(tracking_number) = lower($1)`,
            [number]
          );
          return { ok: true, enabled: false, message: 'Notifications turned off for this tracking number.' };
        }

        await c.query(
          `UPDATE shipments
           SET notify_email = $2, notify_enabled = true, updated_at = now()
           WHERE lower(tracking_number) = lower($1)`,
          [number, email]
        );
        return {
          ok: true,
          enabled: true,
          email,
          message: 'You will receive email updates when this package status changes.',
        };
      });

      return res.status(200).json(result);
    }

    if (req.method === 'GET') {
      const number = String(req.query?.number || '').trim();
      if (!number) return res.status(400).json({ error: 'Missing number' });
      const row = await withDb(async (c) => {
        await ensureSchema(c);
        const r = await c.query(
          `SELECT notify_enabled, notify_email IS NOT NULL AND notify_email <> '' AS has_email
           FROM shipments WHERE lower(tracking_number) = lower($1) LIMIT 1`,
          [number]
        );
        return r.rows[0] || null;
      });
      if (!row) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json({
        enabled: !!row.notify_enabled,
        hasEmail: !!row.has_email,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(400).json({ error: err?.message || 'Notify error' });
  }
}
