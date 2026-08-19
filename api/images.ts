import { isAdmin, withDb } from './lib/db';

function normalizeEvent(raw: any) {
  const e = String(raw || 'setup').toLowerCase();
  if (e === 'delivered') return 'delivered';
  if (e === 'transit' || e === 'on_the_way' || e === 'ontheway' || e === 'in_transit') return 'transit';
  return 'setup';
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const trackingNumber = req.query?.number;
    if (!trackingNumber) return res.status(400).json({ error: 'Missing number' });
    const event = normalizeEvent(req.query?.event);
    try {
      const row = await withDb(async (c) => {
        const r = await c.query(
          'SELECT mime, image FROM tracking_images WHERE tracking_number = $1 AND event_type = $2',
          [trackingNumber, event]
        );
        return r.rows[0] || null;
      });
      if (!row) return res.status(200).json({ found: false });
      const dataUrl = `data:${row.mime};base64,${Buffer.from(row.image).toString('base64')}`;
      res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
      return res.status(200).json({ found: true, dataUrl, eventType: event });
    } catch {
      return res.status(500).json({ error: 'DB error' });
    }
  }

  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });
    const { trackingNumber, dataUrl, eventType } = req.body || {};
    if (!trackingNumber || !dataUrl) return res.status(400).json({ error: 'Missing parameters' });
    const type = normalizeEvent(eventType);
    const match = String(dataUrl).match(/^data:(.+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid dataUrl' });
    try {
      await withDb((c) =>
        c.query(
          `INSERT INTO tracking_images (tracking_number, event_type, mime, image)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (tracking_number, event_type)
           DO UPDATE SET mime = EXCLUDED.mime, image = EXCLUDED.image, created_at = now()`,
          [trackingNumber, type, match[1], Buffer.from(match[2], 'base64')]
        )
      );
      return res.status(200).json({ ok: true, eventType: type });
    } catch {
      return res.status(500).json({ error: 'DB error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
