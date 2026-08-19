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
  history: TrackingEvent[];
}

/** Never show internal wording on the public tracking page */
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

/**
 * FedEx-style place label: "Avenel, NJ US" — never a full street address.
 */
function shortPlace(raw?: string | null, uppercase = false): string {
  if (!raw) return '';
  let s = String(raw).replace(/\s+/g, ' ').trim();
  if (!s) return '';

  // Drop leading street numbers / unit lines when comma-separated
  const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // If first segment looks like a street (starts with digits), drop it
    if (/^\d/.test(parts[0]) || /\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|ct|court|way|hwy)\b/i.test(parts[0])) {
      parts.shift();
    }
  }

  // Prefer last 2–3 geographic chunks: City, ST [Country]
  let chunks = parts.length ? parts : [s];
  if (chunks.length > 3) chunks = chunks.slice(-3);
  if (chunks.length === 1) {
    // "City ST 12345" or "City ST US"
    const m = chunks[0].match(/^(.+?)\s+([A-Z]{2})(?:\s+(\d{5}(-\d{4})?|[A-Z]{2,3}))?$/i);
    if (m) {
      const city = m[1].replace(/\s+\d{5}(-\d{4})?$/, '').trim();
      const st = m[2].toUpperCase();
      const tail = m[3] && !/^\d/.test(m[3]) ? m[3].toUpperCase() : 'US';
      s = `${city}, ${st} ${tail}`;
    }
  } else {
    // Clean zip from last chunks
    chunks = chunks.map((c, i) => {
      if (i === chunks.length - 1) return c.replace(/\b\d{5}(-\d{4})?\b/g, '').trim();
      return c.replace(/\b\d{5}(-\d{4})?\b/g, '').trim();
    }).filter(Boolean);
    if (chunks.length >= 2) {
      const last = chunks[chunks.length - 1];
      const prev = chunks[chunks.length - 2];
      // "NJ" + "United States" → "NJ US"
      if (/united states|usa/i.test(last)) {
        s = `${chunks.slice(0, -1).join(', ')} US`.replace(/,\s*([A-Z]{2})\s+US$/i, ', $1 US');
        // if prev is state code already handled
        if (/^[A-Z]{2}$/i.test(prev)) s = `${chunks.slice(0, -2).concat(prev.toUpperCase()).join(', ')} US`;
      } else if (/^[A-Z]{2}$/i.test(last)) {
        s = `${chunks.slice(0, -1).join(', ')}, ${last.toUpperCase()} US`;
      } else {
        s = chunks.join(', ');
        if (!/\b(US|USA|United States|[A-Z]{2})\s*$/i.test(s)) s = `${s} US`;
      }
    } else {
      s = chunks[0] || s;
    }
  }

  s = s.replace(/,\s*,/g, ',').replace(/\s+/g, ' ').trim();
  return uppercase ? s.toUpperCase() : s;
}

function milestoneIndex(status: string) {
  const s = status.toLowerCase();
  if (s.includes('deliver') && !s.includes('out')) return 4;
  if (s.includes('out for')) return 3;
  if (s.includes('on the way') || s.includes('in transit') || s.includes('depart') || s.includes('arriv') || s.includes('facility')) return 2;
  if (s.includes('pick') || s.includes('we have') || s.includes('package')) return 1;
  if (s.includes('label') || s.includes('created') || s.includes('shipped')) return 0;
  if (s.includes('hold') || s.includes('exception')) return 2;
  return 2;
}

function findEvent(history: TrackingEvent[], ...keys: string[]) {
  return history.find((h) => keys.some((k) => h.status.toLowerCase().includes(k)));
}

function formatWhen(ev?: TrackingEvent) {
  if (!ev) return '';
  if (ev.date && ev.time) return `${ev.date} ${ev.time}`;
  return ev.date || ev.time || '';
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

  const loadImages = async (number: string, status: string) => {
    setSetupImage(null);
    setTransitImage(null);
    setDeliveredImage(null);
    const [setup, transit, delivered] = await Promise.all([
      fetchImage(number, 'setup'),
      fetchImage(number, 'transit'),
      /deliver/i.test(status) && !/out for/i.test(status) ? fetchImage(number, 'delivered') : Promise.resolve(null),
    ]);
    if (setup) setSetupImage(setup);
    if (transit) setTransitImage(transit);
    if (delivered) setDeliveredImage(delivered);
  };

  const trackNumber = async (raw: string) => {
    const number = raw.trim();
    if (!number) {
      toast.error('Enter a tracking number');
      return;
    }
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
          status: trackJson.status || 'In transit',
          estimatedDelivery: trackJson.estimatedDelivery || '',
          origin: trackJson.origin || '',
          destination: trackJson.destination || '',
          service: trackJson.service || '',
          location: trackJson.location || '',
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
            history: shipment.history || [],
          };
        }
      }
      if (!next) {
        toast.error('No information found for that tracking number');
        return;
      }
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
    if (n) {
      setTrackingNumber(n);
      trackNumber(n);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const active = useMemo(() => (result ? milestoneIndex(result.status) : 0), [result]);
  const delivered = !!result && /deliver/i.test(result.status) && !/out for/i.test(result.status);
  const railColor = delivered ? 'bg-[#00843D]' : 'bg-[#4D148C]';
  const activeColor = delivered ? 'bg-[#00843D]' : 'bg-[#4D148C]';

  const milestoneData = useMemo(() => {
    if (!result) return [];
    const hist = result.history || [];
    const label = findEvent(hist, 'label', 'created', 'shipped') || hist[hist.length - 1];
    const picked = findEvent(hist, 'pick', 'we have', 'package');
    const transit = findEvent(hist, 'on the way', 'in transit', 'depart', 'arriv', 'facility');
    const ofd = findEvent(hist, 'out for');
    const del = findEvent(hist, 'deliver');

    // FROM / Label Created — title case city, not street (matches real FedEx app)
    const fromPlace = shortPlace(result.origin || label?.location || '', false);
    const toPlace = shortPlace(result.destination || '', true);

    return [
      {
        title: 'FROM',
        place: fromPlace || '—',
        sub: 'Label Created',
        when: formatWhen(label),
      },
      {
        title: 'WE HAVE YOUR PACKAGE',
        place: shortPlace(picked?.location || result.location || '', true) || '',
        sub: '',
        when: formatWhen(picked),
      },
      {
        title: 'ON THE WAY',
        place: shortPlace(transit?.location || result.location || '', true) || '',
        sub: '',
        when: formatWhen(transit),
      },
      {
        title: 'OUT FOR DELIVERY',
        place: shortPlace(ofd?.location || '', true) || '',
        sub: '',
        when: formatWhen(ofd),
      },
      delivered
        ? {
            title: 'DELIVERED',
            place: shortPlace(del?.location || result.destination || '', true) || '—',
            sub: 'Delivered',
            when: formatWhen(del),
          }
        : {
            title: 'TO',
            place: toPlace || '—',
            sub: 'Scheduled Delivery Date',
            when: result.estimatedDelivery || '',
          },
    ];
  }, [result, delivered]);

  return (
    <div className="min-h-screen bg-white">
      {!result && (
        <section className="bg-[#4D148C] py-12 px-4">
          <div className="max-w-lg mx-auto text-center">
            <h1 className="text-3xl font-light text-white mb-3">Track your package</h1>
            <p className="text-white/80 text-sm mb-6">Enter your tracking number</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                trackNumber(trackingNumber);
              }}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="flex-1 relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Tracking number"
                  className="pl-10 py-6 bg-white text-base"
                />
              </div>
              <Button type="submit" disabled={isTracking} className="bg-[#FF6200] hover:bg-[#e55a00] text-white font-semibold uppercase px-8 py-6">
                {isTracking ? 'Tracking…' : (<><Search className="mr-2 h-4 w-4" />Track</>)}
              </Button>
            </form>
            <div className="mt-5 flex flex-wrap justify-center gap-3 text-sm text-white/70">
              <Link to="/tracking/multiple" className="hover:text-white">Track multiple</Link>
              <span>·</span>
              <Link to="/tracking/reference" className="hover:text-white">Track by reference</Link>
              <span>·</span>
              <Link to="/tracking/scan" className="hover:text-white">Scan barcode</Link>
            </div>
          </div>
        </section>
      )}

      {result && (
        <div className="max-w-lg mx-auto bg-white min-h-screen pb-28 relative">
          <div className="bg-[#FF6200] text-white text-center text-sm font-semibold tracking-wide py-2.5 uppercase">
            Get updates
          </div>

          <div className="px-5 pt-5">
            <button type="button" className="text-[#007AB7] text-sm font-semibold tracking-wide mb-6">
              MORE OPTIONS
            </button>

            <div className="mb-8">
              <p className="text-xs font-semibold tracking-wide text-gray-800 mb-1">TRACKING ID</p>
              <div className="flex items-center gap-2">
                <p className="text-lg text-gray-900 font-medium tracking-wide">{result.number}</p>
                <button
                  type="button"
                  onClick={() => {
                    setTrackingNumber(result.number);
                    setResult(null);
                  }}
                  className="text-[#007AB7] p-1"
                  aria-label="Edit tracking number"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setStarred((s) => !s)}
                  className={`p-1 ${starred ? 'text-[#FF6200]' : 'text-[#007AB7]'}`}
                  aria-label="Star shipment"
                >
                  <Star className={`h-4 w-4 ${starred ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            <div className="relative pl-2">
              {milestoneData.map((m, index) => {
                const isActive = index === active;
                const isPast = index < active;
                const isFuture = index > active;
                const isLast = index === milestoneData.length - 1;

                return (
                  <div key={m.title} className="relative flex gap-4 pb-8 last:pb-2">
                    <div className="relative flex flex-col items-center w-10 flex-shrink-0">
                      {!isLast && (
                        <div
                          className={`absolute top-10 bottom-[-2rem] w-[6px] rounded-full ${
                            isPast || isActive ? railColor : 'bg-gray-200'
                          }`}
                          style={{ left: '50%', transform: 'translateX(-50%)' }}
                        />
                      )}
                      {isActive ? (
                        <div className={`relative z-10 w-10 h-10 rounded-full ${activeColor} flex items-center justify-center shadow-md ring-8 ring-purple-100/80`}>
                          {delivered && index === 4 ? (
                            <Check className="h-5 w-5 text-white stroke-[3]" />
                          ) : index === 0 || index === 1 ? (
                            <MapPin className="h-5 w-5 text-white" />
                          ) : (
                            <ArrowRight className="h-5 w-5 text-white" />
                          )}
                        </div>
                      ) : (
                        <div
                          className={`relative z-10 w-3 h-3 mt-3.5 rounded-full ${
                            isPast ? railColor : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>

                    <div className={`flex-1 min-w-0 ${isActive ? 'bg-gray-100 rounded-2xl px-4 py-3 -ml-1' : 'pt-1'}`}>
                      <p className={`text-sm font-bold tracking-wide ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>
                        {m.title}
                      </p>
                      {m.place && m.place !== '—' && (
                        <p className={`text-sm mt-0.5 ${isFuture ? 'text-gray-400' : 'text-gray-800'}`}>{m.place}</p>
                      )}
                      {m.sub && (
                        <p className={`text-sm italic mt-1 ${isFuture ? 'text-gray-400' : 'text-gray-600'}`}>{m.sub}</p>
                      )}
                      {m.when && (
                        <p className={`text-sm mt-0.5 ${isFuture ? 'text-gray-400' : 'text-gray-700'}`}>{m.when}</p>
                      )}
                      {isActive && index === 0 && (
                        <button type="button" className="text-sm text-gray-900 underline mt-2">View more details</button>
                      )}
                      {isActive && index === 4 && !delivered && result.estimatedDelivery && (
                        <p className="text-sm text-gray-700 mt-1">By end of day</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {(setupImage || transitImage || deliveredImage) && (
              <div className="mt-2 mb-6 grid gap-3">
                {setupImage && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">PACKAGE PHOTO</p>
                    <img src={setupImage} alt="Package" className="w-full max-h-48 object-cover rounded-lg border" />
                  </div>
                )}
                {transitImage && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">ON THE WAY</p>
                    <img src={transitImage} alt="In transit" className="w-full max-h-48 object-cover rounded-lg border" />
                  </div>
                )}
                {deliveredImage && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">PROOF OF DELIVERY</p>
                    <img src={deliveredImage} alt="Delivered" className="w-full max-h-48 object-cover rounded-lg border" />
                  </div>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowHistory((v) => !v)}
              className="flex items-center gap-1 text-[#007AB7] text-sm font-medium mb-6"
            >
              <ChevronDown className={`h-4 w-4 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
              View travel history
            </button>

            {showHistory && (
              <div className="mb-8 border-t pt-4 space-y-4">
                {(result.history || []).length === 0 && (
                  <p className="text-sm text-gray-500">No detailed scans yet for this number.</p>
                )}
                {(result.history || []).map((ev, i) => {
                  const details = publicDetails(ev.status, ev.details);
                  const place = shortPlace(ev.location, false);
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

            <button
              type="button"
              onClick={() => {
                setResult(null);
                setTrackingNumber('');
              }}
              className="text-sm text-[#007AB7] underline"
            >
              Track another package
            </button>
          </div>

          <Link
            to="/support"
            className="fixed bottom-6 right-5 z-20 flex items-center gap-2 bg-[#4D148C] text-white rounded-full px-5 py-3 shadow-lg font-semibold text-sm"
          >
            <MessageCircle className="h-5 w-5" />
            ASK FEDEX
          </Link>
        </div>
      )}
    </div>
  );
}
