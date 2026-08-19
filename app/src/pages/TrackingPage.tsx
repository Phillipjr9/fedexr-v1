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

/** Parse city + state from any address-like string (no street). */
function cityState(raw?: string | null): { city: string; state: string } {
  if (!raw) return { city: '', state: '' };
  let s = String(raw).replace(/\s+/g, ' ').trim();
  if (!s) return { city: '', state: '' };

  let parts = s.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    if (/^\d/.test(parts[0]) || /\b(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane|ct|court|way|hwy|suite|apt)\b/i.test(parts[0])) {
      parts.shift();
    }
  }

  // Strip zips and country words
  parts = parts
    .map((p) => p.replace(/\b\d{5}(-\d{4})?\b/g, '').replace(/\b(united states|usa|u\.s\.)\b/gi, '').trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    const stMatch = last.match(/\b([A-Za-z]{2})\b/);
    const state = (stMatch ? stMatch[1] : last).toUpperCase().slice(0, 2);
    const city = parts.slice(0, -1).join(' ');
    return { city, state };
  }

  const m = s.match(/^(.+?)\s+([A-Za-z]{2})(?:\s|$)/);
  if (m) return { city: m[1].replace(/\d/g, '').trim(), state: m[2].toUpperCase() };
  return { city: s, state: '' };
}

/** FedEx FROM: "Mccordsville, IN US" */
function placeFrom(raw?: string | null) {
  const { city, state } = cityState(raw);
  if (!city && !state) return '';
  if (city && state) return `${city}, ${state} US`;
  return city || state;
}

/** FedEx hub / on the way: "CHAMPAIGN, IL" */
function placeHub(raw?: string | null) {
  const { city, state } = cityState(raw);
  if (!city && !state) return '';
  if (city && state) return `${city}, ${state}`.toUpperCase();
  return (city || state).toUpperCase();
}

/** FedEx TO: "FLORISSANT, MO US" */
function placeTo(raw?: string | null) {
  const { city, state } = cityState(raw);
  if (!city && !state) return '';
  if (city && state) return `${city}, ${state} US`.toUpperCase();
  return (city || state).toUpperCase();
}

function milestoneIndex(status: string) {
  const s = status.toLowerCase();
  if (s.includes('deliver') && !s.includes('out')) return 4;
  if (s.includes('out for')) return 3;
  if (s.includes('on the way') || s.includes('in transit') || s.includes('depart') || s.includes('arriv') || s.includes('facility') || s.includes('held') || s.includes('hold') || s.includes('exception')) return 2;
  if (s.includes('pick') || s.includes('we have')) return 1;
  if (s.includes('label') || s.includes('created') || s.includes('shipped')) return 0;
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
  const brand = delivered ? '#00843D' : '#4D148C';

  const milestoneData = useMemo(() => {
    if (!result) return [];
    const hist = result.history || [];
    const label = findEvent(hist, 'label', 'created', 'shipped') || hist[hist.length - 1];
    const picked = findEvent(hist, 'pick', 'we have');
    const transit = findEvent(hist, 'on the way', 'in transit', 'depart', 'arriv', 'facility');
    const ofd = findEvent(hist, 'out for');
    const del = findEvent(hist, 'deliver');

    const hubPlace =
      placeHub(transit?.location) ||
      placeHub(picked?.location) ||
      placeHub(result.location) ||
      '';

    return [
      {
        title: 'FROM',
        place: placeFrom(result.origin || label?.location) || '',
        sub: 'Label Created',
        when: formatWhen(label),
        extra: '' as string,
      },
      {
        title: 'WE HAVE YOUR PACKAGE',
        place: placeHub(picked?.location) || hubPlace,
        sub: '',
        when: formatWhen(picked),
        extra: '',
      },
      {
        title: 'ON THE WAY',
        place: hubPlace,
        sub: '',
        when: formatWhen(transit) || formatWhen(picked),
        extra: '',
      },
      {
        title: 'OUT FOR DELIVERY',
        place: placeHub(ofd?.location) || '',
        sub: '',
        when: formatWhen(ofd),
        extra: '',
      },
      delivered
        ? {
            title: 'DELIVERED',
            place: placeTo(del?.location || result.destination) || '',
            sub: 'Delivered',
            when: formatWhen(del),
            extra: '',
          }
        : {
            title: 'TO',
            place: placeTo(result.destination) || '',
            sub: 'Scheduled Delivery Date',
            when: result.estimatedDelivery || '',
            extra: result.estimatedDelivery ? 'By end of day' : '',
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

            {/* FedEx-style vertical timeline */}
            <div className="relative">
              {milestoneData.map((m, index) => {
                const isActive = index === active;
                const isPast = index < active;
                const isFuture = index > active;
                const isLast = index === milestoneData.length - 1;
                const railDone = isPast || isActive;

                return (
                  <div key={m.title} className="relative flex gap-4 pb-7 last:pb-2">
                    {/* Left rail + node */}
                    <div className="relative flex flex-col items-center w-11 flex-shrink-0">
                      {!isLast && (
                        <div
                          className="absolute top-11 bottom-[-1.75rem] w-[7px] rounded-full"
                          style={{
                            left: '50%',
                            transform: 'translateX(-50%)',
                            backgroundColor: railDone ? brand : '#E5E7EB',
                          }}
                        />
                      )}
                      {isActive ? (
                        <div
                          className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: brand,
                            boxShadow: `0 0 0 10px ${delivered ? 'rgba(0,132,61,0.12)' : 'rgba(77,20,140,0.12)'}`,
                          }}
                        >
                          {delivered && index === 4 ? (
                            <Check className="h-5 w-5 text-white stroke-[3]" />
                          ) : index <= 1 ? (
                            <MapPin className="h-5 w-5 text-white" />
                          ) : (
                            <ArrowRight className="h-5 w-5 text-white" />
                          )}
                        </div>
                      ) : (
                        <div
                          className="relative z-10 w-3.5 h-3.5 mt-4 rounded-full border-2 bg-white"
                          style={{
                            borderColor: isPast ? brand : '#D1D5DB',
                            backgroundColor: isPast ? '#fff' : '#D1D5DB',
                          }}
                        />
                      )}
                    </div>

                    {/* Content card */}
                    <div
                      className={`flex-1 min-w-0 ${
                        isActive ? 'bg-[#F3F4F6] rounded-2xl px-4 py-3 -ml-0.5' : 'pt-1.5'
                      }`}
                    >
                      <p
                        className={`text-[13px] font-bold tracking-wide ${
                          isFuture ? 'text-gray-400' : 'text-gray-900'
                        }`}
                      >
                        {m.title}
                      </p>
                      {m.place && (
                        <p className={`text-[15px] mt-0.5 ${isFuture ? 'text-gray-400' : 'text-gray-800'}`}>
                          {m.place}
                        </p>
                      )}
                      {m.sub && (
                        <p className={`text-sm italic mt-1 ${isFuture ? 'text-gray-400' : 'text-gray-600'}`}>
                          {m.sub}
                        </p>
                      )}
                      {m.when && (
                        <p className={`text-sm mt-0.5 ${isFuture ? 'text-gray-400' : 'text-gray-700'}`}>
                          {m.when}
                        </p>
                      )}
                      {m.extra && (
                        <p className={`text-sm mt-0.5 ${isFuture ? 'text-gray-400' : 'text-gray-600'}`}>
                          {m.extra}
                        </p>
                      )}
                      {isActive && index === 0 && (
                        <button type="button" className="text-sm text-gray-900 underline mt-2">
                          View more details
                        </button>
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
              className="flex items-center gap-1 text-[#007AB7] text-sm font-medium mb-6 mt-2"
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
