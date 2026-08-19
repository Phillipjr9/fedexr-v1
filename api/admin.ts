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
  return process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || process.env.POSTGRES_URL || process.env.fedex_DATABASE_URL || process.env.fedex_POSTGRES_URL || '';
}
async function withDb(fn: (client: any) => Promise<any>) {
  const connectionString = dbUrl();
  if (!connectionString) throw new Error('No database connection configured');
  const { Client } = await import('pg');
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  try {
    await client.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_fee numeric');
    await client.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS package_size text');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
    await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT false');
    await client.query(`CREATE TABLE IF NOT EXISTS site_banner (
      id INTEGER PRIMARY KEY DEFAULT 1, enabled BOOLEAN DEFAULT true, message TEXT, link_text TEXT, link_href TEXT,
      updated_at TIMESTAMPTZ DEFAULT now(), CONSTRAINT site_banner_singleton CHECK (id = 1)
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS admin_activity (
      id SERIAL PRIMARY KEY, action TEXT NOT NULL, detail TEXT, created_at TIMESTAMPTZ DEFAULT now()
    )`);
    await client.query(`CREATE TABLE IF NOT EXISTS office_locations (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, address TEXT NOT NULL, hours TEXT, phone TEXT, services TEXT,
      active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now()
    )`);
    return await fn(client);
  } finally {
    await client.end();
  }
}

function publicEventDetails(status: string, provided?: string) {
  const raw = String(provided || '').trim();
  if (raw && !/admin/i.test(raw)) return raw;
  const s = String(status || '').toLowerCase();
  if (s.includes('label') || s.includes('created')) return 'Shipping label created';
  if (s.includes('pick')) return 'We have your package';
  if (s.includes('out for')) return 'On a local truck';
  if (s.includes('deliver')) return 'Delivered';
  if (s.includes('hold')) return 'Held at location';
  if (s.includes('transit') || s.includes('on the way')) return 'On the way';
  return 'Shipment updated';
}

function resourceOf(req: any, body: any) {
  return String(req.query?.resource || body.resource || req.url || '').toLowerCase();
}

export default async function handler(req: any, res: any) {
  try {
    const body = parseBody(req);
    req.body = body;
    const route = resourceOf(req, body);
    const wantsLogin = route.includes('login') || (req.method === 'POST' && body.username && body.password && !body.number && !body.message && body.id == null);
    if (wantsLogin) {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (username !== expectedUser() || password !== expectedPass()) return res.status(401).json({ ok: false, error: 'Incorrect username or password' });
      return res.status(200).json({ ok: true, username, secret: password });
    }

    // —— Banner (public GET) ——
    if (route.includes('banner')) {
      if (req.method === 'GET') {
        const banner = await withDb(async (c) => {
          const r = await c.query('SELECT enabled, message, link_text, link_href FROM site_banner WHERE id = 1');
          if (!r.rowCount) {
            return { enabled: true, message: 'US Supreme Court Tariff Update.', linkText: 'See how this may impact you', linkHref: '/support' };
          }
          const row = r.rows[0];
          return { enabled: !!row.enabled, message: row.message || '', linkText: row.link_text || '', linkHref: row.link_href || '' };
        });
        return res.status(200).json({ banner });
      }
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      if (req.method === 'POST') {
        await withDb(async (c) => {
          await c.query(
            `INSERT INTO site_banner (id, enabled, message, link_text, link_href, updated_at)
             VALUES (1, $1, $2, $3, $4, now())
             ON CONFLICT (id) DO UPDATE SET enabled = EXCLUDED.enabled, message = EXCLUDED.message,
               link_text = EXCLUDED.link_text, link_href = EXCLUDED.link_href, updated_at = now()`,
            [!!body.enabled, body.message || '', body.linkText || '', body.linkHref || '']
          );
          await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', ['Banner updated', body.enabled ? body.message || 'shown' : 'hidden']);
        });
        return res.status(200).json({ ok: true });
      }
    }

    // —— Users ——
    if (route.includes('users')) {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      if (req.method === 'GET') {
        const users = await withDb(async (c) => {
          const r = await c.query('SELECT id, email, name, disabled, created_at FROM users ORDER BY id DESC LIMIT 500');
          return r.rows;
        });
        return res.status(200).json({ users });
      }
      if (req.method === 'POST') {
        const id = Number(body.id);
        if (!id) return res.status(400).json({ error: 'User id required' });
        await withDb(async (c) => {
          await c.query('UPDATE users SET disabled = $2 WHERE id = $1', [id, !!body.disabled]);
          await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', [body.disabled ? 'User disabled' : 'User enabled', String(id)]);
        });
        return res.status(200).json({ ok: true });
      }
      if (req.method === 'DELETE') {
        const id = Number(req.query?.id || body.id);
        if (!id) return res.status(400).json({ error: 'User id required' });
        await withDb(async (c) => {
          await c.query('DELETE FROM users WHERE id = $1', [id]);
          await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', ['User deleted', String(id)]);
        });
        return res.status(200).json({ ok: true });
      }
    }

    // —— Activity ——
    if (route.includes('activity')) {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      if (req.method === 'GET') {
        const activity = await withDb(async (c) => {
          const r = await c.query('SELECT id, action, detail, created_at AS at FROM admin_activity ORDER BY created_at DESC LIMIT 100');
          return r.rows;
        });
        return res.status(200).json({ activity });
      }
    }

    // —— Locations ——
    if (route.includes('locations')) {
      if (req.method === 'GET') {
        const all = String(req.query?.all || '') === 'true';
        if (all && !isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
        const locations = await withDb(async (c) => {
          const r = await c.query(
            all
              ? 'SELECT id, name, address, hours, phone, services, active, created_at FROM office_locations ORDER BY id DESC'
              : 'SELECT id, name, address, hours, phone, services, active, created_at FROM office_locations WHERE active = true ORDER BY id DESC'
          );
          return r.rows;
        });
        return res.status(200).json({ locations });
      }
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      if (req.method === 'POST') {
        if (!body.name || !body.address) return res.status(400).json({ error: 'Name and address required' });
        await withDb(async (c) => {
          await c.query(
            'INSERT INTO office_locations (name, address, hours, phone, services, active) VALUES ($1,$2,$3,$4,$5,true)',
            [body.name, body.address, body.hours || '', body.phone || '', body.services || '']
          );
          await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', ['Location added', body.name]);
        });
        return res.status(200).json({ ok: true });
      }
      if (req.method === 'DELETE') {
        const id = Number(req.query?.id || body.id);
        if (!id) return res.status(400).json({ error: 'Location id required' });
        await withDb(async (c) => {
          await c.query('UPDATE office_locations SET active = false WHERE id = $1', [id]);
          await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', ['Location deactivated', String(id)]);
        });
        return res.status(200).json({ ok: true });
      }
    }

    // —— Shipments list (public GET by number or admin list) ——
    if (req.method === 'GET') {
      const number = req.query?.number as string | undefined;
      const shipments = await withDb(async (c) => {
        const params: string[] = [];
        let where = '';
        if (number) { params.push(number); where = 'WHERE lower(s.tracking_number) = lower($1)'; }
        const { rows } = await c.query(
          `SELECT s.tracking_number, s.status, s.origin, s.destination, s.service, s.service_id,
                  s.current_location, s.estimated_delivery_text, s.updated_at, s.shipping_fee, s.package_size,
                  EXISTS (SELECT 1 FROM tracking_images i WHERE i.tracking_number = s.tracking_number AND i.event_type = 'setup') AS has_setup_image,
                  EXISTS (SELECT 1 FROM tracking_images i WHERE i.tracking_number = s.tracking_number AND i.event_type = 'delivered') AS has_delivered_image,
                  EXISTS (SELECT 1 FROM tracking_images i WHERE i.tracking_number = s.tracking_number AND i.event_type = 'transit') AS has_transit_image
           FROM shipments s ${where} ORDER BY s.updated_at DESC NULLS LAST`, params);
        const eventsByNumber: Record<string, any[]> = {};
        if (rows.length) {
          const ev = await c.query('SELECT tracking_number, event_time, location, status, details FROM shipment_events WHERE tracking_number = ANY($1) ORDER BY event_time DESC', [rows.map((r: any) => r.tracking_number)]);
          for (const e of ev.rows) {
            const when = e.event_time;
            (eventsByNumber[e.tracking_number] ||= []).push({
              date: when ? new Date(when).toLocaleDateString() : '',
              time: when ? new Date(when).toLocaleTimeString() : '',
              location: e.location || '', status: e.status || '', completed: true,
              details: publicEventDetails(e.status || '', e.details || ''),
            });
          }
        }
        return rows.map((r: any) => ({
          number: r.tracking_number, status: r.status, origin: r.origin || '', destination: r.destination || '',
          service: r.service || r.service_id || '', estimatedDelivery: r.estimated_delivery_text || '',
          location: r.current_location || '', history: eventsByNumber[r.tracking_number] || [],
          hasSetupImage: r.has_setup_image, hasDeliveredImage: r.has_delivered_image, hasTransitImage: r.has_transit_image,
          shippingFee: r.shipping_fee != null ? Number(r.shipping_fee) : null,
          packageSize: r.package_size || '',
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
        await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', ['Shipment deleted', number]);
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST' && route.includes('events')) {
      const number = String(body.number || '').trim();
      const status = String(body.status || '').trim();
      const location = String(body.location || '').trim();
      if (!number || !status || !location) return res.status(400).json({ error: 'Tracking number, status and location required' });
      const details = publicEventDetails(status, body.details);
      await withDb(async (c) => {
        await c.query('INSERT INTO shipment_events (tracking_number, location, status, details) VALUES ($1,$2,$3,$4)', [number, location, status, details]);
        await c.query('UPDATE shipments SET status = $2, current_location = $3, updated_at = now() WHERE tracking_number = $1', [number, status, location]);
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'POST') {
      const number = String(body.number || '').trim();
      if (!number) return res.status(400).json({ error: 'Tracking number required' });
      const fee = body.shippingFee === '' || body.shippingFee == null ? null : Number(body.shippingFee);
      const status = body.status || 'In transit';
      const details = publicEventDetails(status, body.details);
      const skipEvent = body.skipEvent === true || body.skipEvent === 'true';
      await withDb(async (c) => {
        await c.query(
          `INSERT INTO shipments (tracking_number, status, origin, destination, service, service_id, current_location, estimated_delivery_text, shipping_fee, package_size, updated_at)
           VALUES ($1,$2,$3,$4,$5,$5,$6,$7,$8,$9,now())
           ON CONFLICT (tracking_number) DO UPDATE SET status = EXCLUDED.status, origin = EXCLUDED.origin, destination = EXCLUDED.destination, service = EXCLUDED.service, service_id = EXCLUDED.service_id, current_location = EXCLUDED.current_location, estimated_delivery_text = EXCLUDED.estimated_delivery_text, shipping_fee = EXCLUDED.shipping_fee, package_size = EXCLUDED.package_size, updated_at = now()`,
          [number, status, body.origin || '', body.destination || '', body.service || '', body.location || '', body.estimatedDelivery || '', Number.isFinite(fee) ? fee : null, body.packageSize || '']
        );
        if (!skipEvent) {
          await c.query('INSERT INTO shipment_events (tracking_number, location, status, details) VALUES ($1,$2,$3,$4)', [number, body.location || body.destination || '', status, details]);
        }
        await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', ['Shipment saved', number]);
      });
      return res.status(200).json({ ok: true, number });
    }
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'API error' });
  }
}
