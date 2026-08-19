import { getFedExAccessToken, mapFedExTrackResponse } from './lib/fedexTrack';
import { withDb } from './lib/db';

function publicEventDetails(status: string, provided?: string) {
  const raw = String(provided || '').trim();
  if (raw && !/admin/i.test(raw)) return raw;
  const s = String(status || '').toLowerCase();
  if (s.includes('label') || s.includes('created')) return 'Shipping label created';
  if (s.includes('pick')) return 'We have your package';
  if (s.includes('out for')) return 'On a local truck';
  if (s.includes('deliver')) return 'Delivered';
  if (s.includes('hold')) return 'Held at location';
  if (s.includes('transit') || s.includes('on the way')) return 'On the way';
  return '';
}

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
        try {
          await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipping_fee numeric');
          await c.query('ALTER TABLE shipments ADD COLUMN IF NOT EXISTS package_size text');
        } catch { /* ok */ }
        const ship = await c.query(
          `SELECT tracking_number, status, origin, destination, service, service_id,
                  current_location, estimated_delivery, estimated_delivery_text,
                  shipping_fee, package_size
           FROM shipments WHERE lower(tracking_number) = lower($1) LIMIT 1`,
          [trackingNumber]
        );
        if (!ship.rowCount) return null;
        const events = await c.query(
          `SELECT location, status, details, event_time, created_at
           FROM shipment_events WHERE lower(tracking_number) = lower($1)
           ORDER BY COALESCE(event_time, created_at) DESC LIMIT 50`,
          [trackingNumber]
        );
        const row = ship.rows[0];
        return {
          found: true,
          source: 'neon',
          number: row.tracking_number,
          status: row.status || 'Label created',
          origin: row.origin || '',
          destination: row.destination || '',
          service: row.service || row.service_id || '',
          location: row.current_location || '',
          estimatedDelivery: row.estimated_delivery_text || (row.estimated_delivery ? String(row.estimated_delivery) : ''),
          shippingFee: row.shipping_fee != null ? Number(row.shipping_fee) : null,
          packageSize: row.package_size || '',
          history: events.rows.map((ev: any) => {
            const when = ev.event_time || ev.created_at;
            return {
              date: when ? new Date(when).toLocaleDateString() : '',
              time: when ? new Date(when).toLocaleTimeString() : '',
              location: ev.location || '',
              status: ev.status || row.status,
              completed: true,
              details: publicEventDetails(ev.status || '', ev.details || ''),
            };
          }),
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
    // Prefer Neon extras (fee) when we have a local record
    const local = await neonFallback();
    return res.status(200).json({
      found: true,
      source: 'fedex',
      ...mapped,
      shippingFee: local?.shippingFee ?? null,
      packageSize: local?.packageSize || '',
      origin: mapped.origin || local?.origin || '',
      destination: mapped.destination || local?.destination || '',
    });
  } catch (err: any) {
    const fallback = await neonFallback();
    if (fallback) return res.status(200).json(fallback);
    return res.status(500).json({ found: false, error: err?.message || 'Track error' });
  }
}
