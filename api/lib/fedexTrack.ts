type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

export async function getFedExAccessToken(host: string, clientId: string, clientSecret: string) {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;
  const body = new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret });
  const res = await fetch(`${host}/oauth/token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
  const json: any = await res.json();
  if (!res.ok || !json.access_token) throw new Error(json?.errors?.[0]?.message || 'FedEx OAuth failed');
  tokenCache = { token: json.access_token, expiresAt: Date.now() + (Number(json.expires_in) || 3600) * 1000 };
  return tokenCache.token;
}

const STATUS_MAP: Record<string, string> = {
  OC: 'Label created', PU: 'Picked up', IT: 'In transit', AR: 'At facility', DP: 'In transit',
  OD: 'Out for delivery', DL: 'Delivered', DE: 'Exception', SE: 'Exception', CA: 'Exception', HL: 'Held at location', HA: 'Held at location',
};

function formatStamp(iso?: string) {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: iso, time: '' };
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

function locationLabel(loc: any) {
  if (!loc) return '';
  const city = loc.city || loc.locationContactAndAddress?.address?.city;
  const state = loc.stateOrProvinceCode || loc.locationContactAndAddress?.address?.stateOrProvinceCode;
  const country = loc.countryCode || loc.locationContactAndAddress?.address?.countryCode;
  return [city, state || country].filter(Boolean).join(', ');
}

export function mapFedExTrackResponse(json: any, requestedNumber: string) {
  const result = json?.output?.completeTrackResults?.[0]?.trackResults?.[0];
  if (!result || result.error) return null;
  const latest = result.latestStatusDetail || {};
  const code = latest.code || '';
  const status = STATUS_MAP[code] || latest.description || latest.statusByLocale || 'In transit';
  const dates: any[] = result.dateAndTimes || [];
  const est = dates.find((d) => d.type === 'ESTIMATED_DELIVERY')?.dateTime;
  const act = dates.find((d) => d.type === 'ACTUAL_DELIVERY')?.dateTime;
  const estimatedDelivery = act ? `Delivered ${formatStamp(act).date}` : est ? `Estimated delivery ${formatStamp(est).date}` : '';
  const scans: any[] = result.scanEvents || [];
  const history = (scans.length ? scans : [latest]).map((ev: any) => {
    const stamp = formatStamp(ev.date || ev.dateAndTime || ev.eventTime);
    return { date: stamp.date, time: stamp.time, location: locationLabel(ev.scanLocation || ev.location) || '', status: ev.eventDescription || ev.description || status, completed: true };
  });
  return {
    number: result.trackingNumberInfo?.trackingNumber || requestedNumber,
    status,
    estimatedDelivery,
    service: result.serviceDetail?.description || '',
    origin: '',
    destination: '',
    history,
  };
}
