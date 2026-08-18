import { getFedExAccessToken, mapFedExTrackResponse } from './lib/fedexTrack';
import { withDb } from './lib/db';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const number = (req.method === 'GET' ? req.query?.number : req.body?.number) || req.query?.number;
  const trackingNumber = String(number || '').trim();
  if (!trackingNumber) return res.status(400).json({ found: false, error: 'Missing tracking number' });

  const neonFallback = async () => {
    try {
      return await withDb(async (c) => {
        const ship = await c.query(
          `SELECT tracking_number, status, estimated_delivery, current_location
           FROM shipments WHERE lower(tracking_number) = lower($1) LIMIT 1`,
          [trackingNumber]
        );
        if (!ship.rowCount) return null;
        const events = await c.query(
          `SELECT location, status, details, created_at
           FROM shipment_events WHERE lower(tracking_number) = lower($1)
           ORDER BY created_at DESC LIMIT 50`,
          [trackingNumber]
        );
        const row = ship.rows[0];
        return {
          found: true,
          source: 'neon',
          number: row.tracking_number,
          status: row.status,
          estimatedDelivery: row.estimated_delivery || '',
          history: events.rows.map((ev: any) => ({
            date: ev.created_at ? new Date(ev.created_at).toLocaleDateString() : '',
            time: ev.created_at ? new Date(ev.created_at).toLocaleTimeString() : '',
            location: ev.location || '',
            status: ev.status || row.status,
            completed: true,
          })),
        };
      });
    } catch {
      return null;
    }
  };

  const clientId = process.env.FEDEX_CLIENT_ID;
  const clientSecret = process.env.FEDEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const fallback = await neonFallback();
    if (fallback) return res.status(200).json(fallback);
    return res.status(404).json({ found: false, error: 'No shipment found', source: 'neon' });
  }

  const useSandbox = process.env.FEDEX_API_ENV !== 'production';
  const host = useSandbox ? 'https://apis-sandbox.fedex.com' : 'https://apis.fedex.com';
  try {
    const token = await getFedExAccessToken(host, clientId, clientSecret);
    const trackRes = await fetch(`${host}/track/v1/trackingnumbers`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'x-locale': 'en_US',
      },
      body: JSON.stringify({
        includeDetailedScans: true,
        trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      }),
    });
    const json: any = await trackRes.json();
    if (!trackRes.ok) {
      const fallback = await neonFallback();
      if (fallback) return res.status(200).json(fallback);
      return res.status(trackRes.status).json({ found: false, error: json?.errors?.[0]?.message || 'FedEx track request failed', source: 'fedex' });
    }
    const mapped = mapFedExTrackResponse(json, trackingNumber);
    if (!mapped) {
      const fallback = await neonFallback();
      if (fallback) return res.status(200).json(fallback);
      return res.status(404).json({ found: false, source: 'fedex' });
    }
    return res.status(200).json({ found: true, source: 'fedex', ...mapped });
  } catch (err: any) {
    const fallback = await neonFallback();
    if (fallback) return res.status(200).json(fallback);
    return res.status(500).json({ found: false, error: err?.message || 'Track error' });
  }
}
