import { isAdmin, withDb } from '../lib/db';

export default async function handler(req: any, res: any) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    if (req.method === 'GET') {
      const users = await withDb(async (c) => {
        const r = await c.query(
          `SELECT id, email, name, disabled, created_at
           FROM users
           ORDER BY created_at DESC`
        );
        return r.rows.map((u) => ({
          id: u.id,
          email: u.email,
          name: u.name || '',
          disabled: !!u.disabled,
          createdAt: u.created_at,
        }));
      });
      return res.status(200).json({ users });
    }

    if (req.method === 'POST') {
      const id = Number(req.body?.id);
      const disabled = !!req.body?.disabled;
      if (!id) return res.status(400).json({ error: 'User id required' });
      await withDb(async (c) => {
        await c.query('UPDATE users SET disabled = $2 WHERE id = $1', [id, disabled]);
        await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', [
          disabled ? 'User disabled' : 'User enabled',
          `user #${id}`,
        ]);
      });
      return res.status(200).json({ ok: true });
    }

    if (req.method === 'DELETE') {
      const id = Number(req.query?.id || req.body?.id);
      if (!id) return res.status(400).json({ error: 'User id required' });
      await withDb(async (c) => {
        await c.query('DELETE FROM users WHERE id = $1', [id]);
        await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', [
          'User deleted',
          `user #${id}`,
        ]);
      });
      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'DB error' });
  }
}
