import { isAdminUser } from '../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const username = String(req.body?.username || '').trim();
  const password = String(req.body?.password || '');

  if (!username || !password) {
    return res.status(400).json({ ok: false, error: 'Username and password are required' });
  }

  if (!isAdminUser(username, password)) {
    return res.status(401).json({ ok: false, error: 'Incorrect username or password' });
  }

  return res.status(200).json({
    ok: true,
    username,
    secret: password,
  });
}
