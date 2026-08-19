function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': localStorage.getItem('adminPassword') || '',
  };
}

function clearAdminSession() {
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('adminPassword');
  localStorage.removeItem('adminUsername');
}

async function handleResponse(res: Response, fallback: string) {
  if (res.status === 401) {
    clearAdminSession();
    if (typeof window !== 'undefined' && !window.location.pathname.endsWith('/admin')) {
      window.location.href = '/admin';
    }
    throw new Error('Session expired. Sign in again.');
  }
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json.error || fallback;
    if (/database|connection|DATABASE/i.test(msg)) {
      throw new Error('Database not configured. Set DATABASE_URL (Neon) in Vercel and redeploy.');
    }
    throw new Error(msg);
  }
  return json;
}

export async function apiListShipments() {
  const res = await fetch('/api/admin/shipments', { headers: adminHeaders() });
  const json = await handleResponse(res, 'Could not load shipments from database');
  return json.shipments as any[];
}

export async function apiGetShipment(number: string) {
  const res = await fetch(`/api/admin/shipments?number=${encodeURIComponent(number)}`);
  if (res.status === 401) {
    clearAdminSession();
    return null;
  }
  if (!res.ok) return null;
  const json = await res.json();
  return json.shipments?.[0] || null;
}

export async function apiSaveShipment(body: Record<string, string | boolean>) {
  const res = await fetch('/api/admin/shipments', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res, 'Could not save shipment');
}

export async function apiDeleteShipment(number: string) {
  const res = await fetch(`/api/admin/shipments?number=${encodeURIComponent(number)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  await handleResponse(res, 'Could not delete shipment');
}

export async function apiAddEvent(body: {
  number: string;
  status: string;
  location: string;
  details?: string;
}) {
  const res = await fetch('/api/admin/events', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  await handleResponse(res, 'Could not add scan event');
}

export type ImageEventType = 'setup' | 'delivered' | 'transit';

export const MIN_PACKAGE_PHOTOS = 5;

export async function apiUploadImage(
  trackingNumber: string,
  dataUrl: string,
  eventType: ImageEventType = 'setup'
) {
  const res = await fetch('/api/upload-tracking-image', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ trackingNumber, dataUrl, eventType, replace: false }),
  });
  return handleResponse(res, 'Could not upload image') as Promise<{
    ok: boolean;
    id?: number;
    count?: number;
    meetsMinimum?: boolean;
  }>;
}

export async function apiGetImage(number: string, event: ImageEventType) {
  const res = await fetch(`/api/get-tracking-image?number=${encodeURIComponent(number)}&event=${event}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.found ? (json.dataUrl as string) : null;
}

export async function apiListImages(number: string) {
  const res = await fetch(
    `/api/get-tracking-image?number=${encodeURIComponent(number)}&list=1`
  );
  if (!res.ok) return { count: 0, images: [] as { id: number; eventType: string; dataUrl: string }[] };
  const json = await res.json().catch(() => ({}));
  return {
    count: Number(json.count || 0),
    images: (json.images || []) as { id: number; eventType: string; dataUrl: string }[],
  };
}

export async function apiDeleteImage(id: number) {
  const res = await fetch(`/api/upload-tracking-image?id=${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  await handleResponse(res, 'Could not delete image');
}

export async function apiGetBanner() {
  const res = await fetch('/api/admin/banner');
  const json = await handleResponse(res, 'Could not load banner');
  return json.banner as { enabled: boolean; message: string; linkText: string; linkHref: string };
}

export async function apiSaveBanner(banner: {
  enabled: boolean;
  message: string;
  linkText: string;
  linkHref: string;
}) {
  const res = await fetch('/api/admin/banner', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(banner),
  });
  await handleResponse(res, 'Could not save banner');
}

export async function apiListUsers() {
  const res = await fetch('/api/admin/users', { headers: adminHeaders() });
  const json = await handleResponse(res, 'Could not load users');
  return json.users as any[];
}

export async function apiSetUserDisabled(id: number, disabled: boolean) {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ id, disabled }),
  });
  await handleResponse(res, 'Could not update user');
}

export async function apiSetUserApproved(id: number, approved: boolean) {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ id, approved }),
  });
  await handleResponse(res, 'Could not update approval');
}

export async function apiDeleteUser(id: number) {
  const res = await fetch(`/api/admin/users?id=${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  await handleResponse(res, 'Could not delete user');
}

export async function apiListActivity() {
  const res = await fetch('/api/admin/activity', { headers: adminHeaders() });
  const json = await handleResponse(res, 'Could not load activity');
  return json.activity as any[];
}

export async function apiListLocations(all = false) {
  const res = await fetch(`/api/admin/locations${all ? '?all=true' : ''}`, {
    headers: all ? adminHeaders() : undefined,
  });
  const json = await handleResponse(res, 'Could not load locations');
  return json.locations as any[];
}

export async function apiSaveLocation(body: Record<string, string>) {
  const res = await fetch('/api/admin/locations', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  await handleResponse(res, 'Could not save location');
}

export async function apiDeleteLocation(id: number) {
  const res = await fetch(`/api/admin/locations?id=${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  await handleResponse(res, 'Could not remove location');
}

export async function apiListHolds() {
  const res = await fetch('/api/holds', { headers: adminHeaders() });
  const json = await handleResponse(res, 'Could not load holds');
  return (json.holds || []) as any[];
}

export async function apiMarkPaid(number: string) {
  const res = await fetch('/api/admin/shipments', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ number, action: 'markPaid', markPaid: true }),
  });
  await handleResponse(res, 'Could not mark as paid');
}
