export type FedExService = { id: string; label: string };

export const FEDEX_SERVICES: FedExService[] = [
  { id: 'FEDEX_GROUND', label: 'FedEx Ground' },
  { id: 'FEDEX_HOME_DELIVERY', label: 'FedEx Home Delivery' },
  { id: 'FEDEX_EXPRESS_SAVER', label: 'FedEx Express Saver' },
  { id: 'FEDEX_2_DAY', label: 'FedEx 2Day' },
  { id: 'FEDEX_2_DAY_AM', label: 'FedEx 2Day A.M.' },
  { id: 'STANDARD_OVERNIGHT', label: 'FedEx Standard Overnight' },
  { id: 'PRIORITY_OVERNIGHT', label: 'FedEx Priority Overnight' },
  { id: 'FIRST_OVERNIGHT', label: 'FedEx First Overnight' },
  { id: 'INTERNATIONAL_ECONOMY', label: 'FedEx International Economy' },
  { id: 'INTERNATIONAL_PRIORITY', label: 'FedEx International Priority' },
  { id: 'FEDEX_FREIGHT', label: 'FedEx Freight' },
  { id: 'SAME_DAY', label: 'FedEx SameDay' },
];

export function generateTrackingNumber() {
  const now = Date.now().toString();
  const rand = Math.floor(Math.random() * 1_000_000)
    .toString()
    .padStart(6, '0');
  return `39${now.slice(-4)}${rand}`.slice(0, 12);
}

export type Place = {
  name?: string;
  label?: string;
  display?: string;
  city?: string;
  short?: string;
  lat?: number | string;
  lon?: number | string;
};

export async function geocodePlaces(queries: string[] | string): Promise<Place[]> {
  const list = Array.isArray(queries) ? queries : [queries];
  const out: Place[] = [];
  for (const query of list) {
    const q = String(query || '').trim();
    if (q.length < 2) continue;
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
    const json = await res.json().catch(() => ({ places: [] }));
    const places = Array.isArray(json.places) ? json.places : [];
    if (places[0]) out.push(places[0]);
    else out.push({ name: q, label: q, display: q });
  }
  return out;
}

export async function fetchRoute(from: Place | string, to: Place | string) {
  const fromQ = typeof from === 'string' ? from : from.label || from.name || from.display || '';
  const toQ = typeof to === 'string' ? to : to.label || to.name || to.display || '';
  const res = await fetch(
    `/api/geocode?from=${encodeURIComponent(fromQ)}&to=${encodeURIComponent(toQ)}`
  );
  return res.json() as Promise<{
    from?: Place;
    to?: Place;
    stops: Place[];
    miles?: number;
    minutes?: number;
  }>;
}
