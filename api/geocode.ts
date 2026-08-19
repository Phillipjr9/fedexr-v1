function formatPlace(hit: any) {
  const a = hit.address || {};
  const city = a.city || a.town || a.village || a.hamlet || a.county || '';
  const state = a.state_code || a.state || '';
  const country = a.country_code ? String(a.country_code).toUpperCase() : a.country || '';
  const short = [city, state, country].filter(Boolean).join(', ');
  return {
    label: short || hit.display_name,
    display: hit.display_name,
    lat: hit.lat,
    lon: hit.lon,
  };
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const q = String(req.query?.q || '').trim();
    if (q.length < 2) return res.status(200).json({ places: [] });

    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({
        q,
        format: 'json',
        addressdetails: '1',
        limit: '8',
      }).toString();

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'fedexr-v1-tracking/1.0 (admin address autocomplete)',
        Accept: 'application/json',
      },
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'Geocoding service unavailable', places: [] });
    }
    const data = await response.json();
    const places = Array.isArray(data) ? data.map(formatPlace) : [];
    return res.status(200).json({ places });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Geocode failed', places: [] });
  }
}
