import { isAdmin, withDb } from './lib/db';

function normalizeEvent(raw: any) {
  const e = String(raw || 'setup').toLowerCase();
  if (e === 'delivered') return 'delivered';
  if (e === 'transit' || e === 'on_the_way' || e === 'ontheway' || e === 'in_transit') return 'transit';
  return 'setup';
}

function parseBody(req: any) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

async function ensureImageTable(c: any) {
  await c.query(`
    CREATE TABLE IF NOT EXISTS tracking_images (
      id SERIAL PRIMARY KEY,
      tracking_number TEXT NOT NULL,
      event_type TEXT NOT NULL DEFAULT 'setup',
      mime TEXT NOT NULL,
      image BYTEA NOT NULL,
      created_at TIMESTAMPTZ DEFAULT now(),
      UNIQUE (tracking_number, event_type)
    )
  `);
}

export default async function handler(req: any, res: any) {
  if (req.method === 'GET') {
    const trackingNumber = req.query?.number;
    if (!trackingNumber) return res.status(400).json({ error: 'Missing number' });
    const event = normalizeEvent(req.query?.event);
    try {
      const row = await withDb(async (c) => {
        await ensureImageTable(c);
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
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'DB error reading image' });
    }
  }

  if (req.method === 'POST') {
    if (!isAdmin(req)) return res.status(401).json({ error: 'Unauthorized — sign in again on /admin' });
    const body = parseBody(req);
    const trackingNumber = String(body.trackingNumber || body.number || '').trim();
    const dataUrl = body.dataUrl;
    if (!trackingNumber || !dataUrl) {
      return res.status(400).json({ error: 'Missing tracking number or image data' });
    }
    const type = normalizeEvent(body.eventType);
    const match = String(dataUrl).match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: 'Invalid image data (expected data URL)' });

    const mime = match[1];
    const b64 = match[2];
    // Reject huge payloads early (~3MB binary ≈ 4MB base64)
    if (b64.length > 4_000_000) {
      return res.status(413).json({ error: 'Image too large. Use a smaller photo (under ~2 MB).' });
    }

    try {
      const buf = Buffer.from(b64, 'base64');
      await withDb(async (c) => {
        await ensureImageTable(c);
        await c.query(
          `INSERT INTO tracking_images (tracking_number, event_type, mime, image)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (tracking_number, event_type)
           DO UPDATE SET mime = EXCLUDED.mime, image = EXCLUDED.image, created_at = now()`,
          [trackingNumber, type, mime, buf]
        );
      });
      return res.status(200).json({ ok: true, eventType: type, bytes: Buffer.from(b64, 'base64').length });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'DB error saving image' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
