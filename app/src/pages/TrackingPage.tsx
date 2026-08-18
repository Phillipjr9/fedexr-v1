import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { lookupTracking, type PublicTrackResult } from '@/lib/publicTracking';

const STATUS_STEPS = ['Label created', 'Picked up', 'In transit', 'Out for delivery', 'Delivered'] as const;

function stepIndex(status?: string) {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (s.includes('deliver')) return 4;
  if (s.includes('out for')) return 3;
  if (s.includes('transit') || s.includes('facility')) return 2;
  if (s.includes('pick')) return 1;
  if (s.includes('label')) return 0;
  return 2;
}

export default function TrackingPage() {
  const [params, setParams] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(params.get('number') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PublicTrackResult | null>(null);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const historyVisible = useMemo(() => {
    const h = result?.history || [];
    if (showAllHistory || h.length <= 4) return h;
    return h.slice(0, 4);
  }, [result, showAllHistory]);

  const runTrack = async (n: string) => {
    const number = n.trim();
    if (!number) { toast.error('Please enter a tracking number'); return; }
    setLoading(true);
    setResult(null);
    try {
      const data = await lookupTracking(number);
      setResult(data);
      setParams({ number });
      if (!data.found) toast.message('No information found for that tracking number');
    } catch {
      toast.error('Unable to track right now. Try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const n = params.get('number');
    if (n) { setTrackingNumber(n); void runTrack(n); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const delivered = (result?.status || '').toLowerCase().includes('deliver');
  const showSetup = Boolean(result?.setupImage);
  const showDelivered = Boolean(result?.deliveredImage) && delivered;
  const active = stepIndex(result?.status);

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="bg-white border-b">
        <div className="max-w-[900px] mx-auto px-4 py-10">
          <h1 className="text-3xl font-light mb-6">Track your package</h1>
          <form onSubmit={(e) => { e.preventDefault(); void runTrack(trackingNumber); }} className="flex gap-2">
            <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking ID" className="h-11" />
            <Button type="submit" className="h-11 bg-[#FF6600] text-white" disabled={loading}>
              <Search className="h-4 w-4 mr-1" /> {loading ? 'Tracking…' : 'TRACK'}
            </Button>
          </form>
          <div className="mt-3 flex gap-4 text-sm">
            <Link to="/tracking/multiple" className="text-[#007AB8] hover:underline">Track multiple</Link>
            <Link to="/tracking/reference" className="text-[#007AB8] hover:underline">Track by reference</Link>
          </div>
        </div>
      </div>

      {result?.found && (
        <div className="max-w-[900px] mx-auto px-4 py-8 space-y-6">
          <div className="bg-white rounded-lg border p-6">
            <p className="text-sm text-gray-500">Tracking ID {result.number}</p>
            <h2 className="text-2xl font-semibold text-[#4D148C] mt-1">{result.status}</h2>
            {result.estimatedDelivery && <p className="text-gray-600 mt-1">{result.estimatedDelivery}</p>}
            <div className="mt-8">
              <div className="flex justify-between">
                {STATUS_STEPS.map((label, i) => (
                  <div key={label} className="flex flex-col items-center flex-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${i <= active ? 'bg-[#4D148C] text-white' : 'bg-gray-200'}`}>
                      {i <= active ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                    </div>
                    <span className="text-[11px] text-center">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {showSetup && (
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Package photo</p>
              <img src={result.setupImage!} alt="Shipment" className="max-h-80 rounded-lg object-contain" />
            </div>
          )}
          {showDelivered && (
            <div className="bg-white rounded-lg border p-4">
              <p className="text-sm font-medium mb-2">Proof of delivery</p>
              <img src={result.deliveredImage!} alt="Delivered" className="max-h-80 rounded-lg object-contain" />
            </div>
          )}

          {historyVisible.length > 0 && (
            <div className="bg-white rounded-lg border">
              <div className="px-5 py-3 border-b font-medium">Travel history</div>
              <ul className="divide-y">
                {historyVisible.map((ev, i) => (
                  <li key={i} className="px-5 py-3 text-sm">
                    <span className="font-medium">{ev.status}</span>
                    <span className="block text-gray-500">{ev.location} — {ev.date} {ev.time}</span>
                  </li>
                ))}
              </ul>
              {(result.history?.length || 0) > 4 && (
                <button type="button" className="px-5 py-3 text-sm text-[#007AB8]" onClick={() => setShowAllHistory((v) => !v)}>
                  {showAllHistory ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
