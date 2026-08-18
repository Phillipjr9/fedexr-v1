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
  const name = String(req.body?.name || '').trim();
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Enter a valid email' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!name) return res.status(400).json({ error: 'Enter your name' });
  try {
    const user = await withDb(async (client) => {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rowCount) throw new Error('An account with this email already exists');
      const inserted = await client.query(
        'INSERT INTO users (email, name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, name',
        [email, name, hashPassword(password)]
      );
      return inserted.rows[0];
    });
    return res.status(200).json({ ok: true, user });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Could not create account' });
  }
}
