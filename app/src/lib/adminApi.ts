function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': localStorage.getItem('adminPassword') || '',
  };
}

export async function apiListShipments() {
  const res = await fetch('/api/admin/shipments', { headers: adminHeaders() });
  if (!res.ok) throw new Error('Could not load shipments from database');
  const json = await res.json();
  return json.shipments as any[];
}

export async function apiGetShipment(number: string) {
  const res = await fetch(`/api/admin/shipments?number=${encodeURIComponent(number)}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.shipments?.[0] || null;
}

export async function apiSaveShipment(body: Record<string, string>) {
  const res = await fetch('/api/admin/shipments', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not save shipment');
  return json;
}

export async function apiDeleteShipment(number: string) {
  const res = await fetch(`/api/admin/shipments?number=${encodeURIComponent(number)}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Could not delete shipment');
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
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not add scan event');
}

export async function apiUploadImage(
  trackingNumber: string,
  dataUrl: string,
  eventType: 'setup' | 'delivered'
) {
  const res = await fetch('/api/upload-tracking-image', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ trackingNumber, dataUrl, eventType }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not upload image');
}

export async function apiGetImage(number: string, event: 'setup' | 'delivered') {
  const res = await fetch(`/api/get-tracking-image?number=${encodeURIComponent(number)}&event=${event}`);
  if (!res.ok) return null;
  const json = await res.json();
  return json.found ? (json.dataUrl as string) : null;
}

export async function apiGetBanner() {
  const res = await fetch('/api/admin/banner');
  if (!res.ok) throw new Error('Could not load banner');
  const json = await res.json();
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
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not save banner');
}

export async function apiListUsers() {
  const res = await fetch('/api/admin/users', { headers: adminHeaders() });
  if (!res.ok) throw new Error('Could not load users');
  const json = await res.json();
  return json.users as any[];
}

export async function apiSetUserDisabled(id: number, disabled: boolean) {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify({ id, disabled }),
  });
  if (!res.ok) throw new Error('Could not update user');
}

export async function apiDeleteUser(id: number) {
  const res = await fetch(`/api/admin/users?id=${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Could not delete user');
}

export async function apiListActivity() {
  const res = await fetch('/api/admin/activity', { headers: adminHeaders() });
  if (!res.ok) throw new Error('Could not load activity');
  const json = await res.json();
  return json.activity as any[];
}

export async function apiListLocations(all = false) {
  const res = await fetch(`/api/admin/locations${all ? '?all=true' : ''}`, {
    headers: all ? adminHeaders() : undefined,
  });
  if (!res.ok) throw new Error('Could not load locations');
  const json = await res.json();
  return json.locations as any[];
}

export async function apiSaveLocation(body: Record<string, string>) {
  const res = await fetch('/api/admin/locations', {
    method: 'POST',
    headers: adminHeaders(),
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || 'Could not save location');
}

export async function apiDeleteLocation(id: number) {
  const res = await fetch(`/api/admin/locations?id=${id}`, {
    method: 'DELETE',
    headers: adminHeaders(),
  });
  if (!res.ok) throw new Error('Could not remove location');
}
