function parseBody(req: any) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function dbUrl() {
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.fedex_DATABASE_URL || process.env.fedex_POSTGRES_URL || '';
}

function isAdmin(req: any) {
  const expected = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin');
  const header = req.headers?.['x-admin-secret'] || req.headers?.['X-Admin-Secret'];
  const value = Array.isArray(header) ? header[0] : header;
  return String(value || '') === expected;
}

async function withDb(fn: (c: any) => Promise<any>) {
  const connectionString = dbUrl();
  if (!connectionString) throw new Error('No database connection configured');
  const { Client } = await import('pg');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try { return await fn(client); }
  finally { await client.end(); }
}

export default async function handler(req: any, res: any) {
  try {
    const body = parseBody(req);
    req.body = body;

    if (req.method === 'POST') {
      const number = String(body.number || '').trim();
      const location = String(body.location || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const reason = String(body.reason || '').trim();
      if (!number) return res.status(400).json({ error: 'Tracking number required' });
      if (!location) return res.status(400).json({ error: 'Hold location required' });
      if (!reason) return res.status(400).json({ error: 'Hold reason required' });

      const result = await withDb(async (c) => {
        const ship = await c.query('SELECT tracking_number FROM shipments WHERE lower(tracking_number) = lower($1)', [number]);
        if (!ship.rowCount) throw new Error('No shipment found for that tracking number');
        const inserted = await c.query(
          `INSERT INTO hold_requests (tracking_number, location_name, customer_email, status, reason)
           VALUES ($1,$2,$3,'requested',$4) RETURNING id`,
          [number, location, email || null, reason]
        );
        return inserted.rows[0];
      });
      return res.status(200).json({ ok: true, id: result.id });
    }

    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

    if (req.method === 'GET') {
      const holds = await withDb(async (c) => {
        const r = await c.query(
          `SELECT id, tracking_number, location_name, customer_email, status, reason, created_at
           FROM hold_requests ORDER BY created_at DESC LIMIT 200`
        );
        return r.rows;
      });
      return res.status(200).json({ holds });
    }

    if (req.method === 'PATCH') {
      const id = Number(body.id);
      const status = String(body.status || '').trim();
      if (!id || !['approved', 'declined', 'released'].includes(status)) {
        return res.status(400).json({ error: 'Valid id and status required' });
      }
      await withDb(async (c) => {
        try {
          await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS hold_location TEXT');
        } catch { /* ok */ }
        const row = await c.query('SELECT * FROM hold_requests WHERE id = $1', [id]);
        if (!row.rowCount) throw new Error('Hold request not found');
        const hold = row.rows[0];
        await c.query('UPDATE hold_requests SET status = $2 WHERE id = $1', [id, status]);
        if (status === 'approved') {
          await c.query(
            `UPDATE shipments SET status = 'Held at location', hold_location = $2, current_location = $2, updated_at = now()
             WHERE lower(tracking_number) = lower($1)`,
            [hold.tracking_number, hold.location_name]
          );
          await c.query(
            `INSERT INTO shipment_events (tracking_number, location, status, details)
             VALUES ($1,$2,'Held at location',$3)`,
            [hold.tracking_number, hold.location_name, hold.reason ? `Hold: ${hold.reason}` : 'Hold approved']
          );
        }
        if (status === 'released') {
          await c.query(
            `UPDATE shipments SET status = 'In transit', hold_location = NULL, updated_at = now()
             WHERE lower(tracking_number) = lower($1)`,
            [hold.tracking_number]
          );
          await c.query(
            `INSERT INTO shipment_events (tracking_number, location, status, details)
             VALUES ($1,$2,'In transit','Hold released')`,
            [hold.tracking_number, hold.location_name]
          );
        }
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Hold request failed' });
  }
}
