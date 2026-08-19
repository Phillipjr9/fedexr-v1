export default async function handler(req: any, res: any) {
  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    const route = `${req.url || ''} ${req.query?.resource || ''} ${body.resource || ''}`;
    const wantsLogin = route.includes('login') || (req.method === 'POST' && body.username && body.password && !body.number);

    if (wantsLogin) {
      if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
      const username = String(body.username || '').trim().toLowerCase();
      const password = String(body.password || '');
      const expectedUser = String(process.env.ADMIN_USERNAME || process.env.ADMIN_EMAIL || 'admin').trim().toLowerCase();
      const expectedPass = String(process.env.ADMIN_PASSWORD || process.env.ADMIN_SECRET || 'admin');
      if (!username || !password) {
        return res.status(400).json({ ok: false, error: 'Username and password are required' });
      }
      if (username !== expectedUser || password !== expectedPass) {
        return res.status(401).json({ ok: false, error: 'Incorrect username or password' });
      }
      return res.status(200).json({ ok: true, username, secret: password });
    }

    return res.status(404).json({ error: 'Unknown admin route' });
  } catch (err: any) {
    return res.status(500).json({ ok: false, error: err?.message || 'Admin API error' });
  }
}
