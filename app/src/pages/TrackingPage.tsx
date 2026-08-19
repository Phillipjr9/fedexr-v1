import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Pencil,
  Star,
  MapPin,
  ArrowRight,
  Check,
  ChevronDown,
  MessageCircle,
  Barcode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  completed?: boolean;
  details?: string;
}

interface TrackResult {
  number: string;
  status: string;
  estimatedDelivery: string;
  origin?: string;
  destination?: string;
  service?: string;
  location?: string;
  shippingFee?: number | null;
  packageSize?: string;
  feePaid?: boolean;
  paymentRequired?: boolean;
  history: TrackingEvent[];
}

const STATE_ABBR: Record<string, string> = {
  ALABAMA: 'AL', ALASKA: 'AK', ARIZONA: 'AZ', ARKANSAS: 'AR', CALIFORNIA: 'CA',
  COLORADO: 'CO', CONNECTICUT: 'CT', DELAWARE: 'DE', FLORIDA: 'FL', GEORGIA: 'GA',
  HAWAII: 'HI', IDAHO: 'ID', ILLINOIS: 'IL', INDIANA: 'IN', IOWA: 'IA',
  KANSAS: 'KS', KENTUCKY: 'KY', LOUISIANA: 'LA', MAINE: 'ME', MARYLAND: 'MD',
  MASSACHUSETTS: 'MA', MICHIGAN: 'MI', MINNESOTA: 'MN', MISSISSIPPI: 'MS',
  MISSOURI: 'MO', MONTANA: 'MT', NEBRASKA: 'NE', NEVADA: 'NV', 'NEW HAMPSHIRE': 'NH',
  'NEW JERSEY': 'NJ', 'NEW MEXICO': 'NM', 'NEW YORK': 'NY', 'NORTH CAROLINA': 'NC',
  'NORTH DAKOTA': 'ND', OHIO: 'OH', OKLAHOMA: 'OK', OREGON: 'OR', PENNSYLVANIA: 'PA',
  'RHODE ISLAND': 'RI', 'SOUTH CAROLINA': 'SC', 'SOUTH DAKOTA': 'SD', TENNESSEE: 'TN',
  TEXAS: 'TX', UTAH: 'UT', VERMONT: 'VT', VIRGINIA: 'VA', WASHINGTON: 'WA',
  'WEST VIRGINIA': 'WV', WISCONSIN: 'WI', WYOMING: 'WY', 'DISTRICT OF COLUMBIA': 'DC',
};

function publicDetails(status: string, details?: string) {
  const raw = String(details || '').trim();
  if (raw && !/admin/i.test(raw)) return raw;
  const s = String(status || '').toLowerCase();
  if (s.includes('label') || s.includes('created')) return 'Shipping label created';
  if (s.includes('pick')) return 'We have your package';
  if (s.includes('out for')) return 'On a local truck';
  if (s.includes('deliver')) return 'Delivered';
  if (s.includes('hold')) return 'Held at location';
  if (s.includes('transit') || s.includes('on the way')) return 'On the way';
  return '';
}

function normalizeState(raw: string): string {
  const t = raw.replace(/\b(united states|usa|u\.s\.|us)\b/gi, '').replace(/\d/g, '').trim();
  if (!t) return '';
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  const key = t.toUpperCase();
  return STATE_ABBR[key] || (t.length <= 2 ? t.toUpperCase() : '');
}

function cityState(raw?: string | null): { city: string; state: string } {
  if (!raw) return { city: '', state: '' };
  let s = String(raw).replace(/\s+/g, ' ').trim();
  if (!s) return { city: '', state: '' };
  s = s.replace(/,\s*(united states|usa|u\.s\.|us)\s*$/i, '').trim();
  let parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    if (/^\d/.test(parts[0]) || /\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|ct|court|way|hwy|suite|apt)\b/i.test(parts[0])) {
      parts.shift();
    }
  }
  parts = parts
    .map((p) => p.replace(/\b\d{5}(-\d{4})?\b/g, '').replace(/\b(united states|usa|u\.s\.)\b/gi, '').trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const state = normalizeState(last);
    let city = parts.slice(0, -1).join(' ');
    if (!state) {
      for (const [name, abbr] of Object.entries(STATE_ABBR)) {
        const re = new RegExp(`\\b${name}$`, 'i');
        if (re.test(city)) return { city: city.replace(re, '').trim(), state: abbr };
      }
    }
    for (const [name, abbr] of Object.entries(STATE_ABBR)) {
      if (state === abbr) {
        const re = new RegExp(`\\b${name}$`, 'i');
        city = city.replace(re, '').trim();
      }
    }
    return { city, state };
  }
  for (const [name, abbr] of Object.entries(STATE_ABBR)) {
    const re = new RegExp(`\\b${name}$`, 'i');
    if (re.test(s)) return { city: s.replace(re, '').trim(), state: abbr };
  }
  const m = s.match(/^(.+?)\s+([A-Za-z]{2})$/);
  if (m) return { city: m[1].replace(/\d/g, '').trim(), state: m[2].toUpperCase() };
  return { city: s, state: '' };
}

function titleCaseCity(city: string) {
  return city.toLowerCase().split(/\s+/).map((w) => (w ? w[0].toUpperCase() + w.slice(1) : '')).join(' ');
}

function placeFrom(raw?: string | null) {
  const { city, state } = cityState(raw);
  if (!city && !state) return '';
  if (city && state) return `${city}, ${state} US`.toUpperCase();
  return (city || state).toUpperCase();
}

function placeHub(raw?: string | null) {
  const { city, state } = cityState(raw);
  if (!city && !state) return '';
  if (city && state) return `${city}, ${state}`.toUpperCase();
  return (city || state).toUpperCase();
}

function placeTo(raw?: string | null) {
  const { city, state } = cityState(raw);
  if (!city && !state) return '';
  if (city && state) return `${city}, ${state} US`.toUpperCase();
  return (city || state).toUpperCase();
}

function placeDelivered(raw?: string | null) {
  const { city, state } = cityState(raw);
  if (!city && !state) return '';
  if (city && state) return `${titleCaseCity(city)}, ${state} US`;
  return titleCaseCity(city || state);
}

function rankOfStatus(status: string): number {
  const s = status.toLowerCase();
  if (s.includes('deliver') && !s.includes('out')) return 4;
  if (s.includes('out for')) return 3;
  if (s.includes('on the way') || s.includes('in transit') || s.includes('depart') || s.includes('arriv') || s.includes('facility') || s.includes('held') || s.includes('hold') || s.includes('exception')) return 2;
  if (s.includes('pick') || s.includes('we have')) return 1;
  if (s.includes('label') || s.includes('created') || s.includes('shipped')) return 0;
  return -1;
}

function milestoneIndex(status: string, history: TrackingEvent[]) {
  let max = rankOfStatus(status);
  for (const h of history || []) max = Math.max(max, rankOfStatus(h.status));
  if (max < 0) max = 0;
  const hist = history || [];
  if (hist.length > 0) {
    const onlyLabel = hist.every((h) => rankOfStatus(h.status) <= 0);
    if (onlyLabel) return 0;
  }
  return max;
}

function findEvent(history: TrackingEvent[], ...keys: string[]) {
  return history.find((h) => keys.some((k) => h.status.toLowerCase().includes(k)));
}

function formatWhen(ev?: TrackingEvent, deliveredStyle = false) {
  if (!ev) return '';
  if (ev.date && ev.time) return deliveredStyle ? `${ev.date} at ${ev.time}` : `${ev.date} ${ev.time}`;
  return ev.date || ev.time || '';
}

function formatFee(n?: number | null) {
  if (n == null || !Number.isFinite(n)) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

async function fetchImage(number: string, event: string) {
  try {
    const res = await fetch(`/api/images?number=${encodeURIComponent(number)}&event=${event}`);
    if (!res.ok) return null;
    const j = await res.json();
    return j.found && j.dataUrl ? (j.dataUrl as string) : null;
  } catch {
    return null;
  }
}

export default function TrackingPage() {
  const [params] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(params.get('number') || '');
  const [isTracking, setIsTracking] = useState(false);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [setupImage, setSetupImage] = useState<string | null>(null);
  const [transitImage, setTransitImage] = useState<string | null>(null);
  const [deliveredImage, setDeliveredImage] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [starred, setStarred] = useState(false);
  const [payName, setPayName] = useState('');
  const [payEmail, setPayEmail] = useState('');
  const [paying, setPaying] = useState(false);

  const loadImages = async (number: string, status: string) => {
    setSetupImage(null);
    setTransitImage(null);
    setDeliveredImage(null);
    const [setup, transit, deliveredImg] = await Promise.all([
      fetchImage(number, 'setup'),
      fetchImage(number, 'transit'),
      /deliver/i.test(status) && !/out for/i.test(status) ? fetchImage(number, 'delivered') : Promise.resolve(null),
    ]);
    if (setup) setSetupImage(setup);
    if (transit) setTransitImage(transit);
    if (deliveredImg) setDeliveredImage(deliveredImg);
  };

  const trackNumber = async (raw: string) => {
    const number = raw.trim();
    if (!number) { toast.error('Enter a tracking number'); return; }
    setIsTracking(true);
    setResult(null);
    setShowHistory(false);
    try {
      let next: TrackResult | null = null;
      const trackRes = await fetch(`/api/track?number=${encodeURIComponent(number)}`);
      const trackJson = await trackRes.json().catch(() => ({}));
      if (trackRes.ok && (trackJson.found || trackJson.status)) {
        next = {
          number: trackJson.number || number,
          status: trackJson.status || 'Label created',
          estimatedDelivery: trackJson.estimatedDelivery || '',
          origin: trackJson.origin || '',
          destination: trackJson.destination || '',
          service: trackJson.service || '',
          location: trackJson.location || '',
          shippingFee: trackJson.shippingFee != null ? Number(trackJson.shippingFee) : null,
          packageSize: trackJson.packageSize || '',
          feePaid: !!trackJson.feePaid,
          paymentRequired: !!trackJson.paymentRequired || (!!trackJson.shippingFee && Number(trackJson.shippingFee) > 0 && !trackJson.feePaid),
          history: trackJson.history || [],
        };
      } else {
        const adminRes = await fetch(`/api/admin/shipments?number=${encodeURIComponent(number)}`);
        const adminJson = await adminRes.json().catch(() => ({}));
        const shipment = adminJson.shipments?.[0];
        if (shipment) {
          next = {
            number: shipment.number,
            status: shipment.status,
            estimatedDelivery: shipment.estimatedDelivery || '',
            origin: shipment.origin || '',
            destination: shipment.destination || '',
            service: shipment.service || '',
            location: shipment.location || '',
            shippingFee: shipment.shippingFee != null ? Number(shipment.shippingFee) : null,
            packageSize: shipment.packageSize || '',
            feePaid: !!shipment.feePaid,
            paymentRequired: !!shipment.paymentRequired || (!!shipment.shippingFee && Number(shipment.shippingFee) > 0 && !shipment.feePaid),
            history: shipment.history || [],
          };
        }
      }
      if (!next) { toast.error('No information found for that tracking number'); return; }
      setResult(next);
      await loadImages(next.number, next.status);
    } catch {
      toast.error('Unable to track right now');
    } finally {
      setIsTracking(false);
    }
  };

  useEffect(() => {
    const n = params.get('number');
    if (n) { setTrackingNumber(n); trackNumber(n); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const paymentRequired = !!(result?.paymentRequired);
  const active = useMemo(() => {
    if (!result) return 0;
    if (result.paymentRequired) return 0;
    return milestoneIndex(result.status, result.history || []);
  }, [result]);
  const delivered = !!result && !paymentRequired && /deliver/i.test(result.status) && !/out for/i.test(result.status);
  const brand = delivered ? '#00843D' : '#4D148C';
  const feeLabel = result ? formatFee(result.shippingFee) : '';

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!result) return;
    if (!payName.trim() || !payEmail.trim()) { toast.error('Enter your name and email to pay'); return; }
    setPaying(true);
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: result.number, name: payName.trim(), email: payEmail.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { toast.error(json.error || 'Payment failed'); return; }
      toast.success(json.message || 'Payment received — tracking can continue');
      await trackNumber(result.number);
    } catch {
      toast.error('Could not reach payment service');
    } finally {
      setPaying(false);
    }
  };

  const milestoneData = useMemo(() => {
    if (!result) return [];
    const hist = result.history || [];
    const label = findEvent(hist, 'label', 'created', 'shipped') || hist[hist.length - 1];
    const picked = findEvent(hist, 'pick', 'we have');
    const transit = findEvent(hist, 'on the way', 'in transit', 'depart', 'arriv', 'facility');
    const ofd = findEvent(hist, 'out for');
    const del = findEvent(hist, 'deliver');
    const hubPlace = (transit && placeHub(transit.location)) || (picked && placeHub(picked.location)) || '';
    return [
      { title: 'FROM', place: placeFrom(result.origin || label?.location) || '', sub: 'Label Created', when: formatWhen(label), extra: '' as string },
      { title: 'WE HAVE YOUR PACKAGE', place: active >= 1 ? placeHub(picked?.location) || placeHub(result.location) || hubPlace : '', sub: '', when: formatWhen(picked), extra: '' },
      { title: 'ON THE WAY', place: active >= 2 ? hubPlace || placeHub(result.location) : '', sub: '', when: formatWhen(transit), extra: '' },
      { title: 'OUT FOR DELIVERY', place: active >= 3 ? placeHub(ofd?.location) || placeHub(result.destination) : '', sub: '', when: formatWhen(ofd), extra: '' },
      delivered
        ? { title: 'DELIVERED', place: placeDelivered(del?.location || result.destination) || '', sub: 'Delivered', when: formatWhen(del, true), extra: '' }
        : { title: 'TO', place: placeTo(result.destination) || '', sub: 'Scheduled Delivery Date', when: result.estimatedDelivery || '', extra: result.estimatedDelivery ? 'By end of day' : '' },
    ];
  }, [result, delivered, active]);

  return (
    <div className="min-h-screen bg-white">
      {!result && (
        <section className="bg-[#4D148C] py-12 px-4">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-light text-white mb-3">Track your package</h1>
            <p className="text-white/80 text-sm mb-6">Enter your tracking number</p>
            <form onSubmit={(e) => { e.preventDefault(); trackNumber(trackingNumber); }} className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking number" className="pl-10 py-6 bg-white text-base" />
              </div>
              <Button type="submit" disabled={isTracking} className="bg-[#FF6200] hover:bg-[#e55a00] text-white font-semibold uppercase px-8 py-6">
                {isTracking ? 'Tracking…' : (<><Search className="mr-2 h-4 w-4" />Track</>)}
              </Button>
            </form>
          </div>
        </section>
      )}

      {result && (
        <div className="max-w-lg mx-auto bg-white min-h-screen pb-28 relative">
          <div className="bg-[#FF6200] text-white text-center text-sm font-semibold tracking-wide py-2.5 uppercase">Get updates</div>

          {paymentRequired && feeLabel && (
            <div className="mx-5 mt-4 rounded-xl border-2 border-[#FF6200] bg-orange-50 px-4 py-4 text-sm space-y-3">
              <div>
                <p className="font-bold text-gray-900 text-base">Payment required</p>
                <p className="text-gray-700 mt-1">
                  A shipping fee of <span className="font-semibold">{feeLabel}</span> must be paid before this package can move in the network and tracking can advance past Label Created.
                </p>
                {result.packageSize && <p className="text-gray-600 text-xs mt-1">Package: {result.packageSize}</p>}
                {result.service && <p className="text-gray-600 text-xs">{result.service}</p>}
              </div>
              <form onSubmit={submitPayment} className="space-y-2 bg-white rounded-lg border p-3">
                <Input placeholder="Full name on payment" value={payName} onChange={(e) => setPayName(e.target.value)} required />
                <Input type="email" placeholder="Email for receipt" value={payEmail} onChange={(e) => setPayEmail(e.target.value)} required />
                <Button type="submit" disabled={paying} className="w-full bg-[#FF6200] hover:bg-[#e55a00] text-white font-semibold">
                  {paying ? 'Processing…' : `Pay ${feeLabel} to release tracking`}
                </Button>
              </form>
            </div>
          )}

          {!paymentRequired && feeLabel && (
            <div className="mx-5 mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
              <p className="font-semibold text-gray-900">Shipping charge {feeLabel} · Paid</p>
              {result.packageSize && <p className="text-gray-600 text-xs mt-0.5">Package size: {result.packageSize}</p>}
            </div>
          )}

          <div className="px-5 pt-5">
            <button type="button" className="text-[#007AB7] text-sm font-semibold tracking-wide mb-6">MORE OPTIONS</button>
            <div className="mb-8">
              <p className="text-xs font-semibold tracking-wide text-gray-800 mb-1">TRACKING ID</p>
              <div className="flex items-center gap-2">
                <p className="text-lg text-gray-900 font-medium tracking-wide">{result.number}</p>
                <button type="button" onClick={() => { setTrackingNumber(result.number); setResult(null); }} className="text-[#007AB7] p-1" aria-label="Edit tracking number"><Pencil className="h-4 w-4" /></button>
                <button type="button" onClick={() => setStarred((s) => !s)} className={`p-1 ${starred ? 'text-[#FF6200]' : 'text-[#007AB7]'}`} aria-label="Star shipment"><Star className={`h-4 w-4 ${starred ? 'fill-current' : ''}`} /></button>
              </div>
            </div>

            <div className="relative">
              {milestoneData.map((m, index) => {
                const isActive = index === active;
                const isPast = index < active;
                const isFuture = index > active;
                const isLast = index === milestoneData.length - 1;
                const railDone = delivered || isPast || isActive;
                return (
                  <div key={m.title} className="relative flex gap-4 pb-7 last:pb-4">
                    <div className="relative flex flex-col items-center w-11 flex-shrink-0">
                      {!isLast && (
                        <div className="absolute top-11 bottom-[-1.75rem] w-[7px] rounded-full" style={{ left: '50%', transform: 'translateX(-50%)', backgroundColor: railDone && !isFuture ? brand : '#E5E7EB' }} />
                      )}
                      {isLast && delivered && isActive && (
                        <div className="absolute top-11 h-8 w-[7px] rounded-full" style={{ left: '50%', transform: 'translateX(-50%)', backgroundColor: brand }} />
                      )}
                      {isActive ? (
                        <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center" style={{ backgroundColor: brand, boxShadow: delivered ? '0 0 0 10px rgba(0,132,61,0.15)' : '0 0 0 10px rgba(77,20,140,0.12)' }}>
                          {delivered && index === 4 ? <Check className="h-6 w-6 text-white stroke-[3]" /> : index <= 1 ? <MapPin className="h-5 w-5 text-white" /> : <ArrowRight className="h-5 w-5 text-white" />}
                        </div>
                      ) : (
                        <div className="relative z-10 w-3.5 h-3.5 mt-4 rounded-full border-2" style={{ borderColor: isPast || delivered ? brand : '#D1D5DB', backgroundColor: isPast || delivered ? '#fff' : '#D1D5DB' }} />
                      )}
                    </div>
                    <div className={`flex-1 min-w-0 ${isActive ? 'bg-[#F3F4F6] rounded-2xl px-4 py-3 -ml-0.5' : 'pt-1.5'}`}>
                      <p className={`text-[13px] font-bold tracking-wide ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>{m.title}</p>
                      {m.place && <p className={`text-[15px] mt-0.5 ${isFuture ? 'text-gray-400' : 'text-gray-800'}`}>{m.place}</p>}
                      {m.sub && <p className={`text-sm italic mt-1 ${isFuture ? 'text-gray-400' : 'text-gray-600'}`}>{m.sub}</p>}
                      {m.when && <p className={`text-sm mt-0.5 ${isFuture ? 'text-gray-400' : 'text-gray-700'}`}>{m.when}</p>}
                      {m.extra && <p className={`text-sm mt-0.5 ${isFuture ? 'text-gray-400' : 'text-gray-600'}`}>{m.extra}</p>}
                      {isActive && index === 0 && !paymentRequired && <button type="button" className="text-sm text-gray-900 underline mt-2">View more details</button>}
                      {isActive && index === 0 && paymentRequired && <p className="text-xs text-[#FF6200] mt-2 font-medium">Pay shipping fee to continue tracking</p>}
                    </div>
                  </div>
                );
              })}
            </div>

            {!paymentRequired && (setupImage || transitImage || deliveredImage) && (
              <div className="mt-2 mb-6 grid gap-3">
                {setupImage && <div><p className="text-xs font-semibold text-gray-500 mb-1">PACKAGE PHOTO</p><img src={setupImage} alt="Package" className="w-full max-h-48 object-cover rounded-lg border" /></div>}
                {transitImage && <div><p className="text-xs font-semibold text-gray-500 mb-1">ON THE WAY</p><img src={transitImage} alt="In transit" className="w-full max-h-48 object-cover rounded-lg border" /></div>}
                {deliveredImage && <div><p className="text-xs font-semibold text-gray-500 mb-1">PROOF OF DELIVERY</p><img src={deliveredImage} alt="Delivered" className="w-full max-h-48 object-cover rounded-lg border" /></div>}
              </div>
            )}

            {!paymentRequired && (
              <button type="button" onClick={() => setShowHistory((v) => !v)} className="flex items-center gap-1 text-[#007AB7] text-sm font-medium mb-6 mt-1">
                <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                <span className="underline">View travel history</span>
              </button>
            )}

            {showHistory && !paymentRequired && (
              <div className="mb-8 border-t pt-4 space-y-4">
                {(result.history || []).length === 0 && <p className="text-sm text-gray-500">No detailed scans yet for this number.</p>}
                {(result.history || []).map((ev, i) => {
                  const details = publicDetails(ev.status, ev.details);
                  const place = placeHub(ev.location) || placeFrom(ev.location);
                  return (
                    <div key={`${ev.status}-${i}`} className="text-sm">
                      <p className="font-semibold text-gray-900">{ev.status}</p>
                      {place && <p className="text-gray-600">{place}</p>}
                      <p className="text-gray-400 text-xs">{ev.date}{ev.time ? ` · ${ev.time}` : ''}</p>
                      {details && <p className="text-gray-500 text-xs mt-0.5">{details}</p>}
                    </div>
                  );
                })}
              </div>
            )}

            <button type="button" onClick={() => { setResult(null); setTrackingNumber(''); }} className="text-sm text-[#007AB7] underline">Track another package</button>
          </div>

          <Link to="/support" className="fixed bottom-6 right-5 z-20 flex items-center gap-2 bg-[#4D148C] text-white rounded-full px-5 py-3 shadow-lg font-semibold text-sm">
            <MessageCircle className="h-5 w-5" />ASK FEDEX
          </Link>
        </div>
      )}
    </div>
  );
}
