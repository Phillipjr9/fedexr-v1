import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, ChevronDown, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

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
  setupImage?: string | null;
  transitImage?: string | null;
  deliveredImage?: string | null;
}

function formatFee(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

/** Map status → which milestone is active (0=FROM/Label Created … 4=TO/Delivered) */
function stageFromStatus(status: string, paymentRequired: boolean): number {
  if (paymentRequired) return 0;
  const s = (status || '').toLowerCase();
  if (/deliver/.test(s) && !/out for/.test(s)) return 4;
  if (/out for/.test(s)) return 3;
  if (/transit|facility|on the way|in transit|departed|arrived/.test(s)) return 2;
  if (/picked|we have|pickup|received/.test(s)) return 1;
  return 0; // Label created
}

function firstEventDate(events: TrackingEvent[]): string {
  const e = events?.[0];
  if (!e) return '';
  return [e.date, e.time].filter(Boolean).join(' ');
}

export default function TrackingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('number') || searchParams.get('trkn') || '');
  const [result, setResult] = useState<TrackResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showImages, setShowImages] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [payName, setPayName] = useState('');
  const [payEmail, setPayEmail] = useState('');
  const [paying, setPaying] = useState(false);

  async function runTrack(num?: string) {
    const number = (num || query).trim();
    if (!number) return;
    setLoading(true);
    setError('');
    setResult(null);
    setShowImages(false);
    setShowDetails(false);
    try {
      const res = await fetch(`/api/track?number=${encodeURIComponent(number)}`);
      const trackJson = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(trackJson.error || 'Tracking not found');
      const shipment = trackJson.shipment || trackJson;
      setResult({
        number: shipment.number || number,
        status: shipment.status || 'Label created',
        origin: shipment.origin || '',
        destination: shipment.destination || '',
        service: shipment.service || '',
        estimatedDelivery: shipment.estimatedDelivery || shipment.estimated_delivery_text || '',
        currentLocation: shipment.currentLocation || shipment.current_location || '',
        shippingFee: shipment.shippingFee ?? shipment.shipping_fee ?? null,
        packageSize: shipment.packageSize || shipment.package_size || '',
        feePaid: !!shipment.feePaid || !!shipment.fee_paid,
        collectPayment: !!shipment.collectPayment || !!shipment.collect_payment,
        paymentRequired: !!trackJson.paymentRequired || !!shipment.paymentRequired,
        paymentInstructions: trackJson.paymentInstructions || shipment.paymentInstructions || '',
        events: (trackJson.events || shipment.events || []).map((ev: any) => ({
          date: ev.date || '',
          time: ev.time || '',
          location: ev.location || '',
          status: ev.status || ev.message || '',
          completed: !!ev.completed,
          detail: ev.detail || ev.message || '',
        })),
        setupImage: trackJson.setupImage || shipment.setupImage || null,
        transitImage: trackJson.transitImage || shipment.transitImage || null,
        deliveredImage: trackJson.deliveredImage || shipment.deliveredImage || null,
      });
      setSearchParams({ number });
    } catch (e: any) {
      setError(e.message || 'Could not track');
    } finally {
      setLoading(false);
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
  const stage = result ? stageFromStatus(result.status, paymentRequired) : 0;
  const delivered = stage >= 4;

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
      toast.success(json.message || 'Payment recorded. Tracking will unlock shortly.');
      await runTrack(result.number);
    } catch (err: any) {
      toast.error(err.message || 'Could not record payment');
    } finally {
      setPaying(false);
    }
  }

  const labelDate = useMemo(() => {
    if (!result) return '';
    return firstEventDate(result.events) || new Date().toLocaleString('en-US', {
      month: 'numeric', day: 'numeric', year: '2-digit', hour: 'numeric', minute: '2-digit',
    });
  }, [result]);

  const setupImage = result?.setupImage;
  const transitImage = result?.transitImage;
  const deliveredImage = result?.deliveredImage;

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Search (no result yet) */}
      {!result && (
        <section className="max-w-lg mx-auto px-4 pt-24 pb-16">
          <div className="bg-white rounded-xl shadow-sm border p-6 space-y-4">
            <h1 className="text-xl font-semibold">Track a package</h1>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runTrack();
              }}
              className="flex gap-2"
            >
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tracking number"
                className="flex-1"
              />
              <Button type="submit" disabled={loading} className="bg-[#FF6200] hover:bg-[#e55a00] text-white">
                {loading ? '…' : <Search className="h-4 w-4" />}
              </Button>
            </form>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        </section>
      )}

      {result && (
        <div className="max-w-lg mx-auto bg-white min-h-screen pb-28 pt-4">
          {/* Payment banner — only when admin enabled collect_payment */}
          {paymentRequired && feeLabel && (
            <div className="mx-5 mb-4 rounded-xl border-2 border-[#FF6200] bg-orange-50 px-4 py-4 text-sm space-y-3">
              <div>
                <p className="font-bold text-gray-900 text-base">Pay {feeLabel} to continue tracking</p>
                <p className="text-gray-700 mt-1">
                  This fee must be paid before the package can move in the network and tracking can advance past Label Created.
                </p>
                {result.packageSize && <p className="text-gray-600 text-xs mt-1">Package: {result.packageSize}</p>}
                {result.service && <p className="text-gray-600 text-xs">{result.service}</p>}
              </div>
              {result.paymentInstructions && (
                <div className="rounded-lg border border-amber-300 bg-white px-3 py-2 text-xs text-gray-800 whitespace-pre-wrap">
                  <p className="font-semibold text-gray-900 mb-1">How to pay (offline)</p>
                  {result.paymentInstructions}
                </div>
              )}
              <form onSubmit={submitPayment} className="space-y-2 bg-white rounded-lg border p-3">
                <p className="text-xs text-gray-500">After you pay offline, submit your details so tracking can unlock.</p>
                <Input placeholder="Full name" value={payName} onChange={(e) => setPayName(e.target.value)} required />
                <Input type="email" placeholder="Email for receipt" value={payEmail} onChange={(e) => setPayEmail(e.target.value)} required />
                <Button type="submit" disabled={paying} className="w-full bg-[#FF6200] hover:bg-[#e55a00] text-white font-semibold">
                  {paying ? 'Recording…' : `I paid ${feeLabel} offline — continue tracking`}
                </Button>
              </form>
            </div>
          )}

          {!paymentRequired && feeLabel && (
            <div className="mx-5 mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm">
              <p className="font-semibold text-gray-900">Shipping charge {feeLabel} · Paid</p>
              {result.packageSize && (
                <p className="text-xs text-gray-600 mt-0.5">
                  {result.packageSize}{result.service ? ` · ${result.service}` : ''}
                </p>
              )}
            </div>
          )}

          {/* ——— FedEx-style progress timeline (matches reference screenshot) ——— */}
          <div className="px-5 pt-2 pb-6">
            <div className="relative pl-14">
              {/* Vertical connector line */}
              <div
                className="absolute left-[22px] top-10 bottom-4 w-[3px] rounded-full bg-gray-200"
                aria-hidden
              />

              {/* Stage 0 — FROM / Label Created (active pin) */}
              <div className="relative mb-8">
                {/* Pin with soft halo */}
                <div className="absolute -left-14 top-0 flex h-12 w-12 items-center justify-center">
                  <span className="absolute h-12 w-12 rounded-full bg-[#4D148C]/15" />
                  <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#4D148C] shadow-sm">
                    <MapPin className="h-5 w-5 text-white" strokeWidth={2.25} />
                  </span>
                </div>

                {/* FROM card */}
                <div className="rounded-2xl bg-[#F3F3F5] px-4 py-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-gray-900">From</p>
                  <p className="text-[15px] font-semibold text-gray-900 leading-snug mt-0.5">
                    {result.origin || '—'}
                  </p>
                  <p className="mt-2 text-[14px] italic text-gray-700">Label Created</p>
                  {labelDate && (
                    <p className="text-[13px] text-gray-600 mt-0.5">{labelDate}</p>
                  )}
                  {paymentRequired && feeLabel ? (
                    <p className="mt-2 text-[13px] font-medium text-[#FF6200]">
                      Pay {feeLabel} to continue tracking
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowDetails((v) => !v)}
                      className="mt-2 text-[13px] text-gray-900 underline underline-offset-2"
                    >
                      {showDetails ? 'Hide details' : 'View more details'}
                    </button>
                  )}
                  {showDetails && !paymentRequired && (
                    <div className="mt-2 text-xs text-gray-600 space-y-1 border-t border-gray-200 pt-2">
                      <p>Tracking: <span className="font-mono">{result.number}</span></p>
                      {result.service && <p>Service: {result.service}</p>}
                      {result.packageSize && <p>Package: {result.packageSize}</p>}
                      {result.currentLocation && <p>Last location: {result.currentLocation}</p>}
                    </div>
                  )}
                </div>
              </div>

              {/* Stage 1 — WE HAVE YOUR PACKAGE */}
              <Milestone
                label="WE HAVE YOUR PACKAGE"
                active={stage >= 1}
                done={stage > 1}
              />

              {/* Stage 2 — ON THE WAY */}
              <Milestone
                label="ON THE WAY"
                active={stage >= 2}
                done={stage > 2}
              />

              {/* Stage 3 — OUT FOR DELIVERY */}
              <Milestone
                label="OUT FOR DELIVERY"
                active={stage >= 3}
                done={stage > 3}
              />

              {/* Stage 4 — TO / destination */}
              <div className="relative pb-2">
                <div className="absolute -left-14 top-1 flex h-5 w-5 items-center justify-center">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      delivered
                        ? 'bg-green-600'
                        : stage >= 4
                          ? 'bg-[#4D148C]'
                          : 'bg-gray-300'
                    }`}
                  />
                </div>
                <p
                  className={`text-[13px] font-bold uppercase tracking-wide ${
                    delivered ? 'text-green-700' : stage >= 4 ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  To
                </p>
                <p
                  className={`text-[14px] mt-0.5 ${
                    delivered ? 'text-green-700 font-semibold' : stage >= 4 ? 'text-gray-800' : 'text-gray-400'
                  }`}
                >
                  {result.destination || '—'}
                </p>
              </div>
            </div>

            {/* Package photos (hidden until toggle; only after payment unlocked) */}
            {!paymentRequired && (setupImage || transitImage || deliveredImage) && (
              <div className="mt-8">
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm text-gray-800"
                  onClick={() => setShowImages((v) => !v)}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${showImages ? 'rotate-180' : ''}`} />
                  <span className="underline">{showImages ? 'Hide package photo' : 'Show package photo'}</span>
                </button>
                {showImages && (
                  <div className="mt-3 space-y-3">
                    {setupImage && <img src={setupImage} alt="Package" className="w-full rounded-lg border" />}
                    {transitImage && <img src={transitImage} alt="In transit" className="w-full rounded-lg border" />}
                    {deliveredImage && <img src={deliveredImage} alt="Delivered" className="w-full rounded-lg border" />}
                  </div>
                )}
              </div>
            )}

            {result.estimatedDelivery && !paymentRequired && (
              <p className="mt-6 text-sm text-gray-600">
                Scheduled delivery: <span className="font-medium text-gray-900">{result.estimatedDelivery}</span>
              </p>
            )}
          </div>

          <div className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t px-4 py-3 flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/">Home</Link>
            </Button>
            <Button
              type="button"
              className="flex-1 bg-[#FF6200] hover:bg-[#e55a00] text-white"
              onClick={() => {
                setResult(null);
                setQuery('');
                setSearchParams({});
              }}
            >
              Track another
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Grey milestone row under the FROM card */
function Milestone({
  label,
  active,
  done,
}: {
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className="relative mb-8">
      <div className="absolute -left-14 top-1 flex h-5 w-5 items-center justify-center">
        <span
          className={`h-3 w-3 rounded-full ${
            done || active ? 'bg-[#4D148C]' : 'bg-gray-300'
          }`}
        />
      </div>
      <p
        className={`text-[13px] font-bold uppercase tracking-wide ${
          done || active ? 'text-gray-800' : 'text-gray-400'
        }`}
      >
        {label}
      </p>
    </div>
  );
}
