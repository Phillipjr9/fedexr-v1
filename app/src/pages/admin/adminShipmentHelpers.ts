import { PACKAGE_SIZES } from '@/lib/shippingRates';

export async function compressImage(file: File, maxEdge = 1200, quality = 0.72): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality);
  });
}

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(blob);
  });
}

export const WINDOWS = [
  { id: '', label: 'No window' },
  { id: 'morning', label: 'Morning (8:00 AM – 12:00 PM)', short: 'Morning (8:00 AM – 12:00 PM)' },
  { id: 'afternoon', label: 'Afternoon (12:00 PM – 5:00 PM)', short: 'Afternoon (12:00 PM – 5:00 PM)' },
  { id: 'evening', label: 'Evening (5:00 PM – 8:00 PM)', short: 'Evening (5:00 PM – 8:00 PM)' },
  { id: 'all_day', label: 'All day (8:00 AM – 8:00 PM)', short: 'All day (8:00 AM – 8:00 PM)' },
  { id: 'exact', label: 'Exact time' },
];

export function formatDeliveryLabel(date: string, windowId: string, exactTime: string): string {
  if (!date.trim()) return '';
  try {
    const d = new Date(`${date.trim()}T12:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    const datePart = d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    if (windowId === 'exact' && exactTime.trim()) {
      const [hh, mm] = exactTime.trim().split(':');
      const t = new Date();
      t.setHours(Number(hh) || 0, Number(mm) || 0, 0, 0);
      return `${datePart} by ${t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    const win = WINDOWS.find((w) => w.id === windowId);
    if (win && 'short' in win && win.short) return `${datePart} · ${win.short}`;
    return datePart;
  } catch {
    return date;
  }
}

export function parseDeliveryFields(label?: string): { date: string; windowId: string; exactTime: string } {
  if (!label?.trim()) return { date: '', windowId: '', exactTime: '' };
  const raw = label.trim();
  let date = '';
  const iso = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (iso) date = iso[1];
  else {
    try {
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      }
    } catch {
      /* ok */
    }
  }
  const lower = raw.toLowerCase();
  if (lower.includes('morning')) return { date, windowId: 'morning', exactTime: '' };
  if (lower.includes('afternoon')) return { date, windowId: 'afternoon', exactTime: '' };
  if (lower.includes('evening')) return { date, windowId: 'evening', exactTime: '' };
  if (lower.includes('all day')) return { date, windowId: 'all_day', exactTime: '' };
  const byMatch = raw.match(/by\s+(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (byMatch) {
    let h = Number(byMatch[1]);
    const m = byMatch[2];
    const ap = (byMatch[3] || '').toUpperCase();
    if (ap === 'PM' && h < 12) h += 12;
    if (ap === 'AM' && h === 12) h = 0;
    return { date, windowId: 'exact', exactTime: `${String(h).padStart(2, '0')}:${m}` };
  }
  return { date, windowId: '', exactTime: '' };
}

export const DEFAULT_PAY =
  'Pay via Zelle / bank transfer to the account provided by support. Include your tracking number in the memo. After payment, submit your name and email on the tracking page so we can unlock progress.';

export const DEFAULT_PACKAGE_ID = PACKAGE_SIZES[0]?.id ?? 'medium';

export type GalleryImage = { id: number; eventType: string; dataUrl: string };
