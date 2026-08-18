import { isAdmin, isAdminUser, withDb } from './lib/db';
import shipments from './lib/handlers/shipments';

function routeName(req: any) {
  const url = String(req.url || '');
  const q = String(req.query?.resource || req.body?.resource || '');
  return `${url} ${q}`;
}

export default async function handler(req: any, res: any) {
  const route = routeName(req);
  const isLogin =
    route.includes('login') ||
    (req.method === 'POST' && req.body?.username && req.body?.password && !req.body?.number);

  if (isLogin) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');
    if (!username || !password) {
      return res.status(400).json({ ok: false, error: 'Username and password are required' });
    }
    if (!process.env.ADMIN_USERNAME || !(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET)) {
      return res.status(500).json({ ok: false, error: 'Admin env vars are not set on the server' });
    }
    if (!isAdminUser(username, password)) {
      return res.status(401).json({ ok: false, error: 'Incorrect username or password' });
    }
    return res.status(200).json({ ok: true, username, secret: password });
  }

  if (route.includes('shipments') || req.body?.number && req.method !== 'POST') {
    return shipments(req, res);
  }
  if (route.includes('shipments') || (req.method === 'GET' && req.query?.number) || req.method === 'DELETE' || (req.method === 'POST' && req.body?.number && req.body?.status)) {
    return shipments(req, res);
  }

  if (route.includes('events')) {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const number = String(req.body?.number || '').trim();
    const status = String(req.body?.status || '').trim();
    const location = String(req.body?.location || '').trim();
    const details = String(req.body?.details || '').trim();
    if (!number || !status || !location) return res.status(400).json({ error: 'Tracking number, status and location required' });
    try {
      await withDb(async (c) => {
        const exists = await c.query('SELECT 1 FROM shipments WHERE tracking_number = $1', [number]);
        if (!exists.rowCount) throw new Error('Shipment not found');
        await c.query(`INSERT INTO shipment_events (tracking_number, location, status, details) VALUES ($1,$2,$3,$4)`, [number, location, status, details || 'Admin scan']);
        await c.query(`UPDATE shipments SET status = $2, current_location = $3, updated_at = now() WHERE tracking_number = $1`, [number, status, location]);
      });
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(400).json({ error: err.message || 'Could not add event' });
    }
  }

  if (route.includes('users')) {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    try {
      if (req.method === 'GET') {
        const users = await withDb(async (c) => {
          const r = await c.query('SELECT id, email, name, disabled, created_at FROM users ORDER BY created_at DESC');
          return r.rows.map((u) => ({ id: u.id, email: u.email, name: u.name || '', disabled: !!u.disabled, createdAt: u.created_at }));
        });
        return res.status(200).json({ users });
      }
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'DB error' });
    }
  }

  if (route.includes('activity')) {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const activity = await withDb(async (c) => {
      const r = await c.query('SELECT id, action, detail, created_at FROM admin_activity ORDER BY created_at DESC LIMIT 200');
      return r.rows.map((a) => ({ id: a.id, action: a.action, detail: a.detail || '', at: a.created_at }));
    });
    return res.status(200).json({ activity });
  }

  if (route.includes('banner') && req.method === 'GET') {
    const row = await withDb(async (c) => {
      const r = await c.query('SELECT enabled, message, link_text, link_href FROM site_banner WHERE id = 1');
      return r.rows[0] || null;
    });
    return res.status(200).json({
      banner: row
        ? { enabled: !!row.enabled, message: row.message || '', linkText: row.link_text || '', linkHref: row.link_href || '' }
        : { enabled: false, message: '', linkText: '', linkHref: '' },
    });
  }

  if (route.includes('locations') && req.method === 'GET') {
    const locations = await withDb(async (c) => {
      const r = await c.query('SELECT id, name, address, hours, phone, services, active FROM office_locations ORDER BY id DESC');
      return r.rows;
    });
    return res.status(200).json({ locations });
  }

  if (req.method === 'GET' || req.method === 'POST' || req.method === 'DELETE') {
    return shipments(req, res);
  }

  return res.status(404).json({ error: 'Unknown admin route' });
}
