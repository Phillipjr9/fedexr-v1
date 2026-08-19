const UA = { 'User-Agent': 'fedexr-v1-tracking/1.0', Accept: 'application/json' };

type OsrmRoute = {
  distance?: number;
  duration?: number;
  geometry?: { coordinates?: number[][] };
};

type OsrmResponse = {
  routes?: OsrmRoute[];
};

/** Parse JSON from a Response without throwing on empty/invalid bodies. */
async function safeJson<T = unknown>(response: Response, fallback: T): Promise<T> {
  try {
    const text = await response.text();
    if (!text || !text.trim()) return fallback;
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

function fullAddress(hit: any) {
  const a = hit?.address || {};
  const line1 = [a.house_number, a.road || a.pedestrian || a.highway].filter(Boolean).join(' ');
  const city = a.city || a.town || a.village || a.hamlet || a.suburb || '';
  const state = a.state_code || a.state || '';
  const zip = a.postcode || '';
  const country = a.country_code ? String(a.country_code).toUpperCase() : a.country || '';
  const parts = [line1, city, [state, zip].filter(Boolean).join(' '), country].filter(Boolean);
  return {
    label: parts.join(', ') || hit?.display_name || '',
    display: hit?.display_name || '',
    city: city || hit?.display_name || '',
    lat: String(hit?.lat || ''),
    lon: String(hit?.lon || ''),
  };
}

async function searchPlaces(q: string) {
  try {
    const url =
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({ q, format: 'json', addressdetails: '1', limit: '8' }).toString();
    const response = await fetch(url, { headers: UA });
    if (!response.ok) return [];
    const data = await safeJson<unknown>(response, []);
    return Array.isArray(data) ? data.map(fullAddress) : [];
  } catch {
    return [];
  }
}

async function reverse(lat: number, lon: number) {
  try {
    const url =
      'https://nominatim.openstreetmap.org/reverse?' +
      new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: 'json',
        addressdetails: '1',
        zoom: '14',
      }).toString();
    const response = await fetch(url, { headers: UA });
    if (!response.ok) return null;
    const data = await safeJson<Record<string, unknown> | null>(response, null);
    if (!data) return null;
    return fullAddress(data);
  } catch {
    return null;
  }
}

async function firstPlace(q: string) {
  const places = await searchPlaces(q);
  return places[0] || null;
}

function sampleCoords(coords: number[][], count: number) {
  if (!coords.length) return [];
  const out: number[][] = [];
  const n = Math.min(count, coords.length);
  for (let i = 0; i < n; i++) {
    const idx = Math.round((i / Math.max(n - 1, 1)) * (coords.length - 1));
    out.push(coords[idx]);
  }
  return out;
}

async function buildRoute(fromQ: string, toQ: string) {
  const from = await firstPlace(fromQ);
  const to = await firstPlace(toQ);
  if (!from || !to) return { from, to, stops: [], miles: 0, minutes: 0 };

  try {
    const osrm = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=simplified&geometries=geojson`;
    const routeRes = await fetch(osrm);
    if (!routeRes.ok) return { from, to, stops: [from, to], miles: 0, minutes: 0 };

    const routeJson = await safeJson<OsrmResponse>(routeRes, {});
    const route = routeJson.routes?.[0];
    const coords: number[][] = route?.geometry?.coordinates || [];
    const samples = sampleCoords(coords, 6);
    const stops: ReturnType<typeof fullAddress>[] = [];
    const seen = new Set<string>();

    for (const [lon, lat] of samples) {
      const place = await reverse(lat, lon);
      if (!place) continue;
      const key = place.city.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      stops.push(place);
    }

    if (!stops.length) stops.push(from, to);
    return {
      from,
      to,
      stops,
      miles: route?.distance ? Math.round(route.distance / 1609.34) : 0,
      minutes: route?.duration ? Math.round(route.duration / 60) : 0,
    };
  } catch {
    return { from, to, stops: [from, to], miles: 0, minutes: 0 };
  }
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const from = String(req.query?.from || '').trim();
    const to = String(req.query?.to || '').trim();
    if (from && to) {
      const route = await buildRoute(from, to);
      return res.status(200).json(route);
    }
    const q = String(req.query?.q || '').trim();
    if (q.length < 2) return res.status(200).json({ places: [] });
    return res.status(200).json({ places: await searchPlaces(q) });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Geocode failed', places: [] });
  }
}
