function parseBody(req: any) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function expectedUser() {
  return String(process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin').trim().toLowerCase();
}

function expectedPass() {
  return String(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin');
}

function isAdmin(req: any) {
  const header = req.headers?.['x-admin-secret'] || req.headers?.['X-Admin-Secret'];
  const value = Array.isArray(header) ? header[0] : header;
  return String(value || '') === expectedPass();
}

function dbUrl() {
  return process.env.NEON_DATABASE_URL || process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}

async function withDb(fn: (client: any) => Promise<any>) {
  const connectionString = dbUrl();
  if (!connectionString) throw new Error('No database connection configured');
  const { Client } = await import('pg');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export default async function handler(req: any, res: any) {
  try {
    const body = parseBody(req);
    req.body = body;
    const route = `${req.url || ''} ${req.query?.resource || ''} ${body.resource || ''}`;
    const wantsLogin =
      route.includes('login') ||
      (req.method === 'POST' && body.username && body.password && !body.number);

    if (wantsLogin) {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!username || !password) return res.status(400).json({ ok: false, error: 'Username and password are required' });
      if (username !== expectedUser() || password !== expectedPass()) {
        return res.status(401).json({ ok: false, error: 'Incorrect username or password' });
      }
      return res.status(200).json({ ok: true, username, secret: password });
    }

    if (route.includes('events')) {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const number = String(body.number || '').trim();
      const status = String(body.status || '').trim();
      const location = String(body.location || '').trim();
      const details = String(body.details || '').trim();
      if (!number || !status || !location) return res.status(400).json({ error: 'Tracking number, status and location required' });
      await withDb(async (c) => {
        const exists = await c.query('SELECT 1 FROM shipments WHERE tracking_number = $1', [number]);
        if (!exists.rowCount) throw new Error('Shipment not found');
        await c.query(
          'INSERT INTO shipment_events (tracking_number, location, status, details) VALUES ($1,$2,$3,$4)',
          [number, location, status, details || 'Admin scan']
        );
        await c.query(
          'UPDATE shipments SET status = $2, current_location = $3, updated_at = now() WHERE tracking_number = $1',
          [number, status, location]
        );
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'GET') {
      const number = req.query?.number as string | undefined;
      const shipments = await withDb(async (c) => {
        const params: string[] = [];
        let where = '';
        if (number) {
          params.push(number);
          where = 'WHERE lower(s.tracking_number) = lower($1)';
        }
        const { rows } = await c.query(
          `SELECT s.tracking_number, s.status, s.origin, s.destination, s.service, s.service_id,
                  s.current_location, s.estimated_delivery, s.estimated_delivery_text, s.updated_at,
                  EXISTS (SELECT 1 FROM tracking_images i WHERE i.tracking_number = s.tracking_number AND i.event_type = 'setup') AS has_setup_image,
                  EXISTS (SELECT 1 FROM tracking_images i WHERE i.tracking_number = s.tracking_number AND i.event_type = 'delivered') AS has_delivered_image
           FROM shipments s ${where}
           ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC`,
          params
        );
        const eventsByNumber: Record<string, any[]> = {};
        if (rows.length) {
          const ev = await c.query(
            'SELECT tracking_number, event_time, location, status, details FROM shipment_events WHERE tracking_number = ANY($1) ORDER BY event_time DESC',
            [rows.map((r: any) => r.tracking_number)]
          );
          for (const e of ev.rows) {
            (eventsByNumber[e.tracking_number] ||= []).push({
              date: e.event_time ? new Date(e.event_time).toLocaleDateString() : '',
              time: e.event_time ? new Date(e.event_time).toLocaleTimeString() : '',
              location: e.location || '',
              status: e.status || '',
              completed: true,
              details: e.details || '',
            });
          }
        }
        return rows.map((r: any) => ({
          number: r.tracking_number,
          status: r.status,
          origin: r.origin || '',
          destination: r.destination || '',
          service: r.service || r.service_id || '',
          estimatedDelivery: r.estimated_delivery_text || (r.estimated_delivery ? String(r.estimated_delivery) : ''),
          location: r.current_location || '',
          history: eventsByNumber[r.tracking_number] || [],
          hasSetupImage: r.has_setup_image,
          hasDeliveredImage: r.has_delivered_image,
        }));
      });
      return res.status(200).json({ shipments });
    }

    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized. Sign in again on /admin.' });

    if (req.method === 'DELETE') {
      const number = String(req.query?.number || body.number || '').trim();
      if (!number) return res.status(400).json({ error: 'Tracking number required' });
      await withDb(async (c) => {
        await c.query('DELETE FROM tracking_images WHERE tracking_number = $1', [number]);
        await c.query('DELETE FROM shipment_events WHERE tracking_number = $1', [number]);
        await c.query('DELETE FROM shipments WHERE tracking_number = $1', [number]);
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const number = String(body.number || '').trim();
      if (!number) return res.status(400).json({ error: 'Tracking number required' });
      await withDb(async (c) => {
        await c.query(
          `INSERT INTO shipments (tracking_number, status, origin, destination, service, service_id, current_location, estimated_delivery_text, updated_at)
           VALUES ($1,$2,$3,$4,$5,$5,$6,$7,now())
           ON CONFLICT (tracking_number) DO UPDATE SET
             status = EXCLUDED.status,
             origin = EXCLUDED.origin,
             destination = EXCLUDED.destination,
             service = EXCLUDED.service,
             service_id = EXCLUDED.service_id,
             current_location = EXCLUDED.current_location,
             estimated_delivery_text = EXCLUDED.estimated_delivery_text,
             updated_at = now()`,
          [number, body.status || 'In transit', body.origin || '', body.destination || '', body.service || '', body.location || '', body.estimatedDelivery || '']
        );
        await c.query(
          'INSERT INTO shipment_events (tracking_number, location, status, details) VALUES ($1,$2,$3,$4)',
          [number, body.location || body.destination || '', body.status || 'In transit', 'Admin update']
        );
      });
      return res.status(200).json({ ok: true, number });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: err?.message || 'Admin API error' });
  }
}
