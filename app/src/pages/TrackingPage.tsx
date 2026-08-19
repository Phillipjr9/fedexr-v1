import { useEffect, useMemo, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  MapPin,
  Package,
  Copy,
  Check,
  Share2,
  RefreshCw,
  Printer,
  Headphones,
  Navigation,
  Bell,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ImageLightbox } from '@/components/ImageLightbox';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  completed?: boolean;
  detail?: string;
}

interface TrackResult {
  number: string;
  status: string;
  origin: string;
  destination: string;
  service?: string;
  estimatedDelivery?: string;
  currentLocation?: string;
  shippingFee?: number | null;
  packageSize?: string;
  feePaid?: boolean;
  collectPayment?: boolean;
  paymentRequired?: boolean;
  paymentInstructions?: string;
  events: TrackingEvent[];
  photos: string[];
}

function formatFee(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function stageFromStatus(status: string, paymentRequired: boolean): number {
  if (paymentRequired) return 0;
  const s = (status || '').toLowerCase();
  if (/deliver/.test(s) && !/out for/.test(s)) return 4;
  if (/out for/.test(s)) return 3;
  if (/transit|facility|on the way|in transit|departed|arrived/.test(s)) return 2;
  if (/picked|we have|pickup|received/.test(s)) return 1;
  return 0;
}

function firstEventDate(events: TrackingEvent[]): string {
  const e = events?.[0];
  if (!e) return '';
  return [e.date, e.time].filter(Boolean).join(' ');
}

function pendingKey(number: string) {
  return `track_pay_pending_${number}`;
}

const NOT_FOUND =
  'Sorry, we could not find tracking information for this number. Please check the number and try again, or contact support if you need help.';

async function fetchAllPhotos(number: string): Promise<string[]> {
  try {
    const res = await fetch(`/api/get-tracking-image?number=${encodeURIComponent(number)}&list=1`);
    if (!res.ok) return [];
    const json = await res.json().catch(() => ({}));
    const images = Array.isArray(json.images) ? json.images : [];
    return images.map((i: any) => i.dataUrl).filter(Boolean);
  } catch {
    return [];
  }
}

function mapsUrl(origin: string, destination: string) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`;
}

export default function TrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('number') || searchParams.get('trkn') || '');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [showImages, setShowImages] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [showScans, setShowScans] = useState(true);
  const [payOpen, setPayOpen] = useState(false);
  const [payName, setPayName] = useState('');
  const [payEmail, setPayEmail] = useState('');
  const [paying, setPaying] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [paymentPendingLocal, setPaymentPendingLocal] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubscribed, setNotifySubscribed] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const loadPending = useCallback((number: string) => {
    try {
      setPaymentPendingLocal(localStorage.getItem(pendingKey(number)) === '1');
    } catch {
      setPaymentPendingLocal(false);
    }
  }, []);

  async function runTrack(num?: string, soft = false) {
    const number = (num || query).trim();
    if (!number) return;
    if (soft) setRefreshing(true);
    else {
      setLoading(true);
      setResult(null);
    }
    setError('');
    setShowDetails(false);
    setPayOpen(false);
    setPreviewIndex(null);
    try {
      const res = await fetch(`/api/track?number=${encodeURIComponent(number)}`);
      const trackJson = await res.json().catch(() => ({}));
      if (!res.ok || trackJson.found === false) {
        throw new Error(trackJson.error || NOT_FOUND);
      }
      const shipment = trackJson.shipment || trackJson;
      const rawEvents = trackJson.events || trackJson.history || shipment.events || shipment.history || [];
      const photos = await fetchAllPhotos(number);
      const paymentRequired = !!(trackJson.paymentRequired ?? shipment.paymentRequired);

      if (!paymentRequired) {
        try {
          localStorage.removeItem(pendingKey(number));
        } catch {
          /* ok */
        }
        setPaymentPendingLocal(false);
      } else {
        loadPending(number);
      }

      setResult({
        number: shipment.number || number,
        status: shipment.status || 'Label created',
        origin: shipment.origin || '',
        destination: shipment.destination || '',
        service: shipment.service || '',
        estimatedDelivery: shipment.estimatedDelivery || shipment.estimated_delivery_text || '',
        currentLocation: shipment.currentLocation || shipment.current_location || shipment.location || '',
        shippingFee: shipment.shippingFee ?? shipment.shipping_fee ?? null,
        packageSize: shipment.packageSize || shipment.package_size || '',
        feePaid: !!(shipment.feePaid ?? shipment.fee_paid),
        collectPayment: !!(shipment.collectPayment ?? shipment.collect_payment),
        paymentRequired,
        paymentInstructions: trackJson.paymentInstructions || shipment.paymentInstructions || '',
        events: (Array.isArray(rawEvents) ? rawEvents : []).map((ev: any) => ({
          date: ev.date || '',
          time: ev.time || '',
          location: ev.location || '',
          status: ev.status || ev.message || '',
          completed: ev.completed !== false,
          detail: ev.detail || ev.details || ev.message || '',
        })),
        photos,
      });
      setShowImages(photos.length > 0);
      setSearchParams({ number });
      try {
        const nr = await fetch(`/api/notify?number=${encodeURIComponent(number)}`);
        if (nr.ok) {
          const nj = await nr.json();
          setNotifySubscribed(!!nj.enabled);
        }
      } catch {
        /* ok */
      }
    } catch (e: any) {
      setError(e.message || NOT_FOUND);
      if (!soft) setResult(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    const n = searchParams.get('number') || searchParams.get('trkn');
    if (n) {
      setQuery(n);
      runTrack(n);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const paymentRequired = !!(result?.paymentRequired);
  const feeLabel = result?.shippingFee != null && result.shippingFee > 0 ? formatFee(result.shippingFee) : '';
  const stage = result ? stageFromStatus(result.status, paymentRequired && !paymentPendingLocal) : 0;
  const delivered = stage >= 4;
  const showPendingBanner = paymentRequired && paymentPendingLocal;

  async function copyNumber() {
    if (!result?.number) return;
    try {
      await navigator.clipboard.writeText(result.number);
      setCopied(true);
      toast.success('Tracking number copied');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy');
    }
  }

  async function shareLink() {
    if (!result?.number) return;
    const url = `${window.location.origin}/tracking?number=${encodeURIComponent(result.number)}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Track package', text: `Tracking ${result.number}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Tracking link copied');
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') toast.error('Could not share');
    }
  }

  function printPage() {
    window.print();
  }

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
    setPaying(true);
    try {
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: result.number, name: payName.trim(), email: payEmail.trim(), offline: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Payment record failed');
      try {
        localStorage.setItem(pendingKey(result.number), '1');
      } catch {
        /* ok */
      }
      setPaymentPendingLocal(true);
      setPayOpen(false);
      toast.success(json.message || 'Payment submitted. Awaiting confirmation.');
      await runTrack(result.number, true);
    } catch (err: any) {
      toast.error(err.message || 'Could not record payment');
    } finally {
      setPaying(false);
    }
  }

  async function submitNotify(e: React.FormEvent) {
    e.preventDefault();
    if (!result) return;
    setNotifying(true);
    try {
      const res = await fetch('/api/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: result.number, email: notifyEmail.trim(), enable: true }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || 'Could not enable notifications');
      setNotifySubscribed(true);
      toast.success(json.message || 'Status notifications enabled');
    } catch (err: any) {
      toast.error(err.message || 'Could not enable notifications');
    } finally {
      setNotifying(false);
    }
  }

  const labelDate = useMemo(() => {
    if (!result) return '';
    return firstEventDate(result.events) || new Date().toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
    });
  }, [result]);

  const photos = result?.photos || [];
  const hasAnyImage = photos.length > 0;
  const scanEvents = result?.events || [];

  return (
    <div className="min-h-screen bg-[#F7F7F8] text-gray-900 track-print-root">
      <style>{`
        @media print {
          header, footer, .no-print, .live-chat, [class*="LiveChat"] { display: none !important; }
          .track-print-root { background: white !important; }
          .print-break { break-inside: avoid; }
        }
      `}</style>

      {!result && !loading && (
        <section className="max-w-lg mx-auto px-4 pt-20 pb-16">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
            <h1 className="text-xl font-semibold tracking-tight">Track a package</h1>
            <form onSubmit={(e) => { e.preventDefault(); runTrack(); }} className="flex gap-2">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tracking number" className="flex-1 h-11" aria-label="Tracking number" />
              <Button type="submit" disabled={loading} className="h-11 bg-[#FF6200] hover:bg-[#e55a00] text-white px-4" aria-label="Search">{loading ? '…' : <Search className="h-4 w-4" />}</Button>
            </form>
            {error && (
              <div className="space-y-2">
                <p className="text-sm text-red-600 leading-relaxed">{error}</p>
                <Link to="/support" className="text-sm text-[#4D148C] font-medium underline underline-offset-2">Contact support</Link>
              </div>
            )}
          </div>
        </section>
      )}

      {loading && !result && (
        <div className="max-w-lg mx-auto px-4 pt-16 pb-28 animate-pulse space-y-4" aria-busy="true" aria-label="Loading tracking">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-7 w-48 bg-gray-200 rounded" />
            <div className="h-4 w-36 bg-gray-100 rounded" />
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
            <div className="h-3 w-28 bg-gray-200 rounded" />
            <div className="h-20 bg-gray-100 rounded-xl" />
          </div>
        </div>
      )}

      {result && (
        <div className="max-w-lg mx-auto min-h-screen pb-28">
          <div className="sticky top-16 md:top-[6.5rem] z-20 bg-white/95 backdrop-blur border-b border-gray-100 px-5 pt-4 pb-3 print-break">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#4D148C]/10">
                <Package className="h-5 w-5 text-[#4D148C]" strokeWidth={2} aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Status</p>
                <p className="text-xl font-bold text-gray-900 leading-tight mt-0.5">{result.status || 'Label created'}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <p className="font-mono text-[13px] text-gray-500 tracking-wide">{result.number}</p>
                  <button type="button" onClick={copyNumber} className="no-print inline-flex items-center gap-1 text-xs font-medium text-[#4D148C] hover:underline" aria-label="Copy tracking number">
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
                {result.service && <p className="mt-1 text-xs text-gray-500">{result.service}{result.packageSize ? ` · ${result.packageSize}` : ''}</p>}
              </div>
            </div>
            <div className="no-print mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={() => runTrack(result.number, true)} disabled={refreshing}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${refreshing ? 'animate-spin' : ''}`} />{refreshing ? 'Refreshing…' : 'Refresh'}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={shareLink}><Share2 className="h-3.5 w-3.5 mr-1" /> Share</Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={printPage}><Printer className="h-3.5 w-3.5 mr-1" /> Print</Button>
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs" asChild><Link to="/support"><Headphones className="h-3.5 w-3.5 mr-1" /> Support</Link></Button>
            </div>
          </div>

          {showPendingBanner && feeLabel && (
            <div className="mx-4 mt-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm print-break">
              <p className="font-semibold text-blue-900">Payment confirmation pending</p>
              <p className="text-blue-800 text-xs mt-1">We received your offline payment notice for {feeLabel}. Tracking advances after confirmation.</p>
            </div>
          )}

          {paymentRequired && feeLabel && !showPendingBanner && (
            <div className="mx-4 mt-3 rounded-xl border border-amber-200/80 bg-white shadow-sm overflow-hidden print-break no-print">
              <button type="button" onClick={() => setPayOpen((v) => !v)} className="w-full flex items-center gap-3 px-4 py-3 text-left">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-sm font-bold">$</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">Shipping fee due · {feeLabel}</p>
                  <p className="text-xs text-gray-500">Pay offline to unlock further updates</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 ${payOpen ? 'rotate-180' : ''}`} />
              </button>
              {payOpen && (
                <div className="border-t border-amber-100 px-4 pb-4 pt-3 space-y-3">
                  {result.paymentInstructions && <p className="text-xs text-gray-600 whitespace-pre-wrap bg-amber-50/80 rounded-lg px-3 py-2">{result.paymentInstructions}</p>}
                  <form onSubmit={submitPayment} className="space-y-2">
                    <Input placeholder="Full name" value={payName} onChange={(e) => setPayName(e.target.value)} required className="h-10" />
                    <Input type="email" placeholder="Email for receipt" value={payEmail} onChange={(e) => setPayEmail(e.target.value)} required className="h-10" />
                    <Button type="submit" disabled={paying} className="w-full h-10 bg-[#FF6200] hover:bg-[#e55a00] text-white text-sm font-semibold">{paying ? 'Recording…' : `Confirm offline payment · ${feeLabel}`}</Button>
                  </form>
                </div>
              )}
            </div>
          )}

          {!paymentRequired && feeLabel && (
            <div className="mx-4 mt-3 rounded-lg border border-green-200 bg-green-50/80 px-4 py-2.5 text-sm text-green-700 font-medium">Shipping charge {feeLabel} · Paid</div>
          )}

          {result.estimatedDelivery && (
            <div className="mx-4 mt-3 rounded-lg border border-gray-100 bg-white px-4 py-2.5 text-sm">
              <span className="text-gray-500">Scheduled delivery: </span>
              <span className="font-semibold text-gray-900">{result.estimatedDelivery}</span>
            </div>
          )}

          {(result.origin || result.destination) && (
            <div className="mx-4 mt-3 rounded-xl border border-gray-100 bg-white px-4 py-3">
              <div className="flex items-start gap-2">
                <Navigation className="h-4 w-4 text-[#4D148C] mt-0.5 shrink-0" />
                <div className="text-sm min-w-0 flex-1">
                  <p className="font-medium text-gray-900">Route</p>
                  <p className="text-gray-600 mt-1">From {result.origin || '—'}</p>
                  <p className="text-gray-600">To {result.destination || '—'}</p>
                  {result.origin && result.destination && (
                    <a href={mapsUrl(result.origin, result.destination)} target="_blank" rel="noopener noreferrer" className="no-print inline-block mt-2 text-xs font-medium text-[#4D148C] underline">Open in Maps</a>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mx-4 mt-3 rounded-xl border border-gray-100 bg-white px-4 py-3 no-print">
            <div className="flex items-start gap-2">
              <Bell className="h-4 w-4 text-[#4D148C] mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1 text-sm">
                <p className="font-medium text-gray-900">Delivery status notifications</p>
                {notifySubscribed ? (
                  <p className="text-xs text-green-700 mt-1">You are signed up for email updates on this package.</p>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 mt-1">Get an email when status changes (in transit, out for delivery, delivered).</p>
                    <form onSubmit={submitNotify} className="mt-2 flex flex-col sm:flex-row gap-2">
                      <Input type="email" required placeholder="you@email.com" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} className="h-9 text-sm" />
                      <Button type="submit" disabled={notifying} className="h-9 bg-[#4D148C] hover:bg-[#3d1070] text-white text-xs shrink-0">{notifying ? 'Saving…' : 'Notify me'}</Button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="mx-4 mt-4 mb-6 rounded-2xl bg-white border border-gray-100 shadow-sm px-5 py-6">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-5">Shipment progress</p>
            <div className="relative pl-12">
              <div className="absolute left-[18px] top-3 bottom-3 w-[2px] bg-gray-200" aria-hidden />
              <div className="relative mb-10">
                <div className="absolute -left-12 top-0 flex h-9 w-9 items-center justify-center">
                  <span className="absolute h-9 w-9 rounded-full bg-[#4D148C]/15" />
                  <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-[#4D148C]"><MapPin className="h-4 w-4 text-white" /></span>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#4D148C]">From</p>
                <p className="text-base font-semibold text-gray-900 mt-1">{result.origin || '—'}</p>
                <p className="mt-2 text-sm font-medium">Label Created</p>
                {labelDate && <p className="text-sm text-gray-500 mt-0.5">{labelDate}</p>}
              </div>
              <Milestone label="We have your package" active={stage >= 1} done={stage > 1} />
              <Milestone label="On the way" active={stage >= 2} done={stage > 2} />
              <Milestone label="Out for delivery" active={stage >= 3} done={stage > 3} />
              <div className="relative pt-1">
                <div className="absolute -left-12 top-1.5 flex h-9 w-9 items-center justify-center">
                  <span className={`h-3.5 w-3.5 rounded-full ring-4 ring-white ${delivered ? 'bg-green-600' : 'bg-gray-300'}`} />
                </div>
                <p className={`text-[11px] font-bold uppercase ${delivered ? 'text-green-700' : 'text-gray-400'}`}>To</p>
                <p className={`text-base mt-1 ${delivered ? 'text-green-700 font-semibold' : 'text-gray-400'}`}>{result.destination || '—'}</p>
              </div>
            </div>

            {scanEvents.length > 0 && (
              <div className="mt-8 pt-5 border-t border-gray-100">
                <button type="button" className="flex items-center gap-2 text-sm font-medium text-gray-700" onClick={() => setShowScans((v) => !v)}>
                  <ChevronDown className={`h-4 w-4 ${showScans ? 'rotate-180' : ''}`} />
                  <span>{showScans ? 'Hide scan history' : `Show scan history (${scanEvents.length})`}</span>
                </button>
                {showScans && (
                  <ul className="mt-3 space-y-3">
                    {[...scanEvents].reverse().map((ev, i) => (
                      <li key={i} className="rounded-lg bg-gray-50 px-3 py-2.5 text-sm border border-gray-100">
                        <p className="font-medium">{ev.status || 'Update'}</p>
                        {(ev.date || ev.time) && <p className="text-xs text-gray-500">{[ev.date, ev.time].filter(Boolean).join(' · ')}</p>}
                        {ev.location && <p className="text-xs text-gray-600">{ev.location}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {hasAnyImage && (
              <div className="mt-8 pt-5 border-t border-gray-100">
                <button type="button" className="flex items-center gap-2 text-sm font-medium" onClick={() => setShowImages((v) => !v)}>
                  <ChevronDown className={`h-4 w-4 ${showImages ? 'rotate-180' : ''}`} />
                  <span>{showImages ? 'Hide package photos' : `Show package photos (${photos.length})`}</span>
                </button>
                {showImages && (
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {photos.map((src, i) => (
                      <button key={i} type="button" className="text-left rounded-xl overflow-hidden border" onClick={() => setPreviewIndex(i)}>
                        <img src={src} alt={`Package ${i + 1}`} className="w-full h-28 object-cover" />
                        <p className="text-[11px] text-gray-500 px-2 py-1 bg-gray-50">Photo {i + 1}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="no-print fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white/95 backdrop-blur border-t px-4 py-3 flex gap-2">
            <Button asChild variant="outline" className="flex-1 h-11"><Link to="/">Home</Link></Button>
            <Button type="button" className="flex-1 h-11 bg-[#FF6200] hover:bg-[#e55a00] text-white" onClick={() => { setResult(null); setQuery(''); setError(''); setPaymentPendingLocal(false); setNotifySubscribed(false); setSearchParams({}); }}>Track another</Button>
          </div>
        </div>
      )}

      {previewIndex != null && photos[previewIndex] && (
        <ImageLightbox images={photos} index={previewIndex} onClose={() => setPreviewIndex(null)} onIndexChange={setPreviewIndex} title="Package photo" />
      )}
    </div>
  );
}

function Milestone({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  const on = done || active;
  return (
    <div className="relative mb-10">
      <div className="absolute -left-12 top-1.5 flex h-9 w-9 items-center justify-center">
        <span className={`h-3.5 w-3.5 rounded-full ring-4 ring-white ${on ? 'bg-[#4D148C]' : 'bg-gray-300'}`} />
      </div>
      <p className={`text-[15px] font-semibold ${on ? 'text-gray-900' : 'text-gray-400'}`}>{label}</p>
    </div>
  );
}
