import { isAdmin, withDb } from './lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized' });

  const { trackingNumber, dataUrl, eventType } = req.body || {};
  if (!trackingNumber || !dataUrl) return res.status(400).json({ error: 'Missing parameters' });

  const type = eventType === 'delivered' ? 'delivered' : 'setup';
  const match = String(dataUrl).match(/^data:(.+);base64,(.+)$/);
  if (!match) return res.status(400).json({ error: 'Invalid dataUrl' });

  const mime = match[1];
  const buffer = Buffer.from(match[2], 'base64');

  try {
    await withDb((c) =>
      c.query(
        `INSERT INTO tracking_images (tracking_number, event_type, mime, image)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (tracking_number, event_type)
         DO UPDATE SET mime = EXCLUDED.mime, image = EXCLUDED.image, created_at = now()`,
        [trackingNumber, type, mime, buffer]
      )
    );
    return res.status(200).json({ ok: true, eventType: type });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'DB error' });
  }
}
