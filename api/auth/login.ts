import { createHash } from 'crypto';
import { withDb } from '../lib/db';

function hashPassword(password: string) {
  const salt = process.env.AUTH_SALT || 'fedexr-v1';
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  if (!email || !password) return res.status(400).json({ error: 'Enter email and password' });
  try {
    const user = await withDb(async (client) => {
      const result = await client.query(
        'SELECT id, email, name, password_hash, disabled FROM users WHERE email = $1',
        [email]
      );
      return result.rows[0] || null;
    });
    if (!user || !user.password_hash || user.password_hash !== hashPassword(password)) {
      return res.status(401).json({ error: 'No account matches that email and password. Create an account first.' });
    }
    if (user.disabled) {
      return res.status(403).json({ error: 'This account has been disabled by an administrator.' });
    }
    return res.status(200).json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Login failed' });
  }
}
