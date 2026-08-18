import { withDb } from './lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const trackingNumber = req.query?.number;
  if (!trackingNumber) return res.status(400).json({ error: 'Missing number' });

  const event = req.query?.event === 'delivered' ? 'delivered' : 'setup';

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
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
}
