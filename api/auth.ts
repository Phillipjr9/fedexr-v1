import { createHash } from 'crypto';
import { withDb } from './lib/db';

function hashPassword(password: string) {
  const salt = process.env.AUTH_SALT || 'fedexr-v1';
  return createHash('sha256').update(`${salt}:${password}`).digest('hex');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const path = String(req.url || '');
  const isRegister = path.includes('register') || req.query?.action === 'register' || req.body?.action === 'register';
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const name = String(req.body?.name || '').trim();

  if (!email || !password) return res.status(400).json({ error: 'Enter email and password' });

  try {
    if (isRegister) {
      if (!email.includes('@')) return res.status(400).json({ error: 'Enter a valid email' });
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      if (!name) return res.status(400).json({ error: 'Enter your name' });
      const user = await withDb(async (client) => {
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT false');
        await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false');
        const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rowCount) throw new Error('An account with this email already exists');
        const inserted = await client.query(
          `INSERT INTO users (email, name, password_hash, disabled, approved)
           VALUES ($1, $2, $3, false, false)
           RETURNING id, email, name, approved`,
          [email, name, hashPassword(password)]
        );
        return inserted.rows[0];
      });
      return res.status(200).json({
        ok: true,
        pending: true,
        message: 'Account created. An administrator must approve your signup before you can sign in.',
        user: { id: user.id, email: user.email, name: user.name, approved: false },
      });
    }

    const user = await withDb(async (client) => {
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT');
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT false');
      await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false');
      const result = await client.query(
        'SELECT id, email, name, password_hash, disabled, approved FROM users WHERE email = $1',
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
    if (!user.approved) {
      return res.status(403).json({
        error: 'Your account is waiting for admin approval. You will be able to sign in after an administrator verifies your signup.',
        pending: true,
      });
    }
    return res.status(200).json({
      ok: true,
      user: { id: user.id, email: user.email, name: user.name, approved: true },
    });
  } catch (err: any) {
    return res.status(400).json({ error: err.message || 'Auth failed' });
  }
}
