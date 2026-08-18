import { getFedExAccessToken, mapFedExTrackResponse } from './lib/fedexTrack';

export default async function handler(req: any, res: any) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const number = (req.method === 'GET' ? req.query?.number : req.body?.number) || req.query?.number;
  const trackingNumber = String(number || '').trim();
  if (!trackingNumber) return res.status(400).json({ found: false, error: 'Missing tracking number' });

  const clientId = process.env.FEDEX_CLIENT_ID;
  const clientSecret = process.env.FEDEX_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return res.status(503).json({ found: false, error: 'FedEx API is not configured', source: 'unconfigured' });
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
    const json = await trackRes.json();
    if (!trackRes.ok) {
      return res.status(trackRes.status).json({ found: false, error: json?.errors?.[0]?.message || 'FedEx track request failed', source: 'fedex' });
    }
    const mapped = mapFedExTrackResponse(json, trackingNumber);
    if (!mapped) return res.status(404).json({ found: false, source: 'fedex' });
    return res.status(200).json({ found: true, source: 'fedex', ...mapped });
  } catch (err: any) {
    return res.status(500).json({ found: false, error: err?.message || 'Track error' });
  }
}
