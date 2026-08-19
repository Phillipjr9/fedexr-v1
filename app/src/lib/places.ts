export const FEDEX_SERVICES = [
  'FedEx Ground',
  'FedEx Home Delivery',
  'FedEx Express Saver',
  'FedEx 2Day',
  'FedEx 2Day A.M.',
  'FedEx Standard Overnight',
  'FedEx Priority Overnight',
  'FedEx First Overnight',
  'FedEx International Economy',
  'FedEx International Priority',
  'FedEx Freight',
  'FedEx SameDay',
] as const;

export function generateTrackingNumber() {
  const now = Date.now().toString();
  const rand = Math.floor(Math.random() * 1_000_000).toString().padStart(6, '0');
  return `39${now.slice(-4)}${rand}`.slice(0, 12);
}

export type Place = { label: string; display: string; city?: string; lat?: string; lon?: string };

export async function geocodePlaces(query: string): Promise<Place[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
  const json = await res.json().catch(() => ({ places: [] }));
  return Array.isArray(json.places) ? json.places : [];
}

export async function fetchRoute(from: string, to: string) {
  const res = await fetch(`/api/geocode?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
  return res.json();
}
