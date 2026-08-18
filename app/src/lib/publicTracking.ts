import { getShipment, type ShipmentRecord } from '@/lib/adminStore';
import { apiGetImage, apiGetShipment } from '@/lib/adminApi';

export interface PublicTrackResult {
  found: boolean;
  source?: 'fedex' | 'admin' | 'unconfigured';
  number?: string;
  status?: string;
  estimatedDelivery?: string;
  history?: ShipmentRecord['history'];
  setupImage?: string | null;
  deliveredImage?: string | null;
  error?: string;
}

async function imagesFor(number: string, hasSetup?: boolean, hasDelivered?: boolean) {
  const [setup, delivered] = await Promise.all([
    hasSetup === false ? Promise.resolve(null) : apiGetImage(number, 'setup'),
    hasDelivered === false ? Promise.resolve(null) : apiGetImage(number, 'delivered'),
  ]);
  return { setupImage: setup, deliveredImage: delivered };
}

export async function lookupTracking(number: string): Promise<PublicTrackResult> {
  const trimmed = number.trim();

  try {
    const api = await fetch(`/api/track?number=${encodeURIComponent(trimmed)}`);
    const json = await api.json();
    if (json.found) {
      const neon = await apiGetShipment(trimmed).catch(() => null);
      const imgs = neon
        ? await imagesFor(trimmed, neon.hasSetupImage, neon.hasDeliveredImage)
        : { setupImage: null, deliveredImage: null };
      return {
        found: true,
        source: 'fedex',
        number: json.number,
        status: json.status,
        estimatedDelivery: json.estimatedDelivery,
        history: json.history,
        ...imgs,
      };
    }
  } catch {
    // fall through
  }

  try {
    const neon = await apiGetShipment(trimmed);
    if (neon) {
      const imgs = await imagesFor(trimmed, neon.hasSetupImage, neon.hasDeliveredImage);
      return {
        found: true,
        source: 'admin',
        number: neon.number,
        status: neon.status,
        estimatedDelivery: neon.estimatedDelivery,
        history: neon.history,
        ...imgs,
      };
    }
  } catch {
    // fall through to local cache
  }

  const local = getShipment(trimmed);
  if (local) {
    return {
      found: true,
      source: 'admin',
      number: local.number,
      status: local.status,
      estimatedDelivery: local.estimatedDelivery,
      history: local.history,
      setupImage: local.setupImageDataUrl || local.imageDataUrl || null,
      deliveredImage: local.deliveredImageDataUrl || null,
    };
  }

  return { found: false };
}
