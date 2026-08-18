export const ADMIN_FLAG_KEY = 'isAdmin';
export const ADMIN_PASSWORD_KEY = 'adminPassword';
export const SHIPMENTS_KEY = 'fedexr_shipments';
export const BANNER_KEY = 'fedexr_banner';
export const ACTIVITY_KEY = 'fedexr_admin_activity';
export const DEFAULT_ADMIN_PASSWORD = 'admin';

export const SHIPMENT_STATUSES = [
  'Label created', 'Picked up', 'In transit', 'At facility', 'Out for delivery', 'Delivered', 'Exception', 'Held at location',
] as const;

export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];

export interface TrackingEvent {
  date: string; time: string; location: string; status: string; completed: boolean;
}

export interface ShipmentRecord {
  number: string;
  status: ShipmentStatus;
  origin: string;
  destination: string;
  service: string;
  estimatedDelivery: string;
  history: TrackingEvent[];
  setupImageDataUrl?: string;
  deliveredImageDataUrl?: string;
  imageDataUrl?: string;
  updatedAt: string;
}

export interface BannerConfig {
  enabled: boolean; message: string; linkText: string; linkHref: string;
}

export interface ActivityEntry { at: string; action: string; detail: string; }

export const DEFAULT_BANNER: BannerConfig = {
  enabled: true,
  message: 'US Supreme Court Tariff Update.',
  linkText: 'See how this may impact you',
  linkHref: '/support',
};

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}
function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function isAdminLoggedIn() {
  return localStorage.getItem(ADMIN_FLAG_KEY) === 'true';
}
export function getAdminPassword() {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) ?? DEFAULT_ADMIN_PASSWORD;
}
export function loginAdmin(password: string) {
  if (password !== getAdminPassword()) return false;
  localStorage.setItem(ADMIN_FLAG_KEY, 'true');
  logActivity('Login', 'Admin signed in');
  return true;
}
export function logoutAdmin() {
  localStorage.removeItem(ADMIN_FLAG_KEY);
}
export function setAdminPassword(current: string, next: string) {
  if (current !== getAdminPassword()) return false;
  localStorage.setItem(ADMIN_PASSWORD_KEY, next);
  logActivity('Settings', 'Admin password changed');
  return true;
}
export function getShipments(): ShipmentRecord[] {
  return readJson<ShipmentRecord[]>(SHIPMENTS_KEY, []);
}
export function saveShipments(shipments: ShipmentRecord[]) {
  writeJson(SHIPMENTS_KEY, shipments);
}
export function getShipment(number: string) {
  const n = number.trim();
  return getShipments().find((s) => s.number.toLowerCase() === n.toLowerCase());
}
export function upsertShipment(record: ShipmentRecord) {
  const all = getShipments();
  const idx = all.findIndex((s) => s.number.toLowerCase() === record.number.toLowerCase());
  const next = { ...record, updatedAt: new Date().toISOString() };
  if (idx >= 0) all[idx] = next; else all.unshift(next);
  saveShipments(all);
  return next;
}
export function deleteShipment(number: string) {
  saveShipments(getShipments().filter((s) => s.number.toLowerCase() !== number.toLowerCase()));
  logActivity('Shipment deleted', number);
}
export function getBanner(): BannerConfig {
  return readJson<BannerConfig>(BANNER_KEY, DEFAULT_BANNER);
}
export function saveBanner(banner: BannerConfig) {
  writeJson(BANNER_KEY, banner);
  logActivity('Banner updated', banner.enabled ? banner.message : 'Banner hidden');
}
export function getActivity(): ActivityEntry[] {
  return readJson<ActivityEntry[]>(ACTIVITY_KEY, []);
}
export function logActivity(action: string, detail: string) {
  const entries = getActivity();
  entries.unshift({ at: new Date().toISOString(), action, detail });
  writeJson(ACTIVITY_KEY, entries.slice(0, 100));
}
export function nowParts() {
  const d = new Date();
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}
export function statusToHistory(status: ShipmentStatus, location: string): TrackingEvent[] {
  const { date, time } = nowParts();
  return [{ date, time, location, status, completed: true }];
}
