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

function adminUsername() {
  return String(process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin').trim().toLowerCase();
}

function adminPassword() {
  return String(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin');
}

export default async function handler(req: any, res: any) {
  try {
    const body = parseBody(req);
    req.body = body;
    const route = `${req.url || ''} ${req.query?.resource || ''} ${body?.resource || ''}`;
    const isLogin =
      route.includes('login') ||
      (req.method === 'POST' && body.username && body.password && !body.number);

    if (isLogin) {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!username || !password) {
        return res.status(400).json({ ok: false, error: 'Username and password are required' });
      }
      if (username !== adminUsername() || password !== adminPassword()) {
        return res.status(401).json({
          ok: false,
          error: 'Incorrect username or password',
          hint: process.env.ADMIN_USERNAME ? 'env-set' : 'env-missing',
        });
      }
      return res.status(200).json({ ok: true, username, secret: password });
    }

    const { default: shipments } = await import('./lib/handlers/shipments');
    const db = await import('./lib/db');
    const { isAdmin, withDb } = db;

    if (route.includes('events')) {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      return res.status(405).json({ error: 'Use POST /api/admin?resource=events' });
    }

    if (route.includes('users') && req.method === 'GET') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
      const users = await withDb(async (c) => {
        const r = await c.query('SELECT id, email, name, disabled, created_at FROM users ORDER BY created_at DESC');
        return r.rows.map((u) => ({ id: u.id, email: u.email, name: u.name || '', disabled: !!u.disabled, createdAt: u.created_at }));
      });
      return res.status(200).json({ users });
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

    return shipments(req, res);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err?.message || 'Admin API error' });
  }
}
