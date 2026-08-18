import { isAdmin, withDb } from '../lib/db';

export default async function handler(req: any, res: any) {
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const activity = await withDb(async (c) => {
      const r = await c.query(
        `SELECT id, action, detail, created_at
         FROM admin_activity
         ORDER BY created_at DESC
         LIMIT 200`
      );
      return r.rows.map((a) => ({
        id: a.id,
        action: a.action,
        detail: a.detail || '',
        at: a.created_at,
      }));
    });
    return res.status(200).json({ activity });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'DB error' });
  }
}
