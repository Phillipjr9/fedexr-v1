function adminHeaders() {
  return {
    'Content-Type': 'application/json',
    'x-admin-secret': localStorage.getItem('adminPassword') || process.env.ADMIN_SECRET || 'admin',
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

export async function apiUploadImage(trackingNumber: string, dataUrl: string, eventType: 'setup' | 'delivered') {
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
