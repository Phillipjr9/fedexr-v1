import { isAdmin, withDb } from '../lib/db';

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    try {
      const row = await withDb(async (c) => {
        const r = await c.query('SELECT enabled, message, link_text, link_href FROM site_banner WHERE id = 1');
        return r.rows[0] || null;
      });
      return res.status(200).json({
        banner: row
          ? {
              enabled: !!row.enabled,
              message: row.message || '',
              linkText: row.link_text || '',
              linkHref: row.link_href || '',
            }
          : { enabled: false, message: '', linkText: '', linkHref: '' },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'DB error' });
    }
  }

  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const enabled = !!req.body?.enabled;
    const message = String(req.body?.message || '');
    const linkText = String(req.body?.linkText || '');
    const linkHref = String(req.body?.linkHref || '');
    try {
      await withDb(async (c) => {
        await c.query(
          `INSERT INTO site_banner (id, enabled, message, link_text, link_href, updated_at)
           VALUES (1, $1, $2, $3, $4, now())
           ON CONFLICT (id) DO UPDATE SET
             enabled = EXCLUDED.enabled,
             message = EXCLUDED.message,
             link_text = EXCLUDED.link_text,
             link_href = EXCLUDED.link_href,
             updated_at = now()`,
          [enabled, message, linkText, linkHref]
        );
        await c.query('INSERT INTO admin_activity (action, detail) VALUES ($1, $2)', [
          'Banner updated',
          enabled ? message : 'Banner hidden',
        ]);
      });
      return res.status(200).json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || 'DB error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
