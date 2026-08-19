function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function adminUsername() {
  return String(process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin').trim().toLowerCase();
}

function adminPassword() {
  return String(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin');
}

module.exports = async function handler(req, res) {
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
        return res.status(401).json({ ok: false, error: 'Incorrect username or password' });
      }
      return res.status(200).json({ ok: true, username, secret: password });
    }

    const shipments = require('./lib/handlers/shipments').default || require('./lib/handlers/shipments');
    return shipments(req, res);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err && err.message ? err.message : 'Admin API error' });
  }
};
