import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { HOLD_REASONS, reasonText } from '@/lib/holdReasons';

export default function DeliveryManagerActionPage() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const action = pathname.split('/').pop() || 'hold';
  const [number, setNumber] = useState(params.get('number') || '');
  const [locationName, setLocationName] = useState('');
  const [reasonId, setReasonId] = useState(HOLD_REASONS[0].id);
  const [customReason, setCustomReason] = useState('');
  const [busy, setBusy] = useState(false);
  const signedIn = typeof window !== 'undefined' && Boolean(sessionStorage.getItem('fx_user'));
  const user = (() => {
    try { return JSON.parse(sessionStorage.getItem('fx_user') || 'null'); } catch { return null; }
  })();

  if (action !== 'hold') {
    const titles: Record<string, string> = {
      instructions: 'Delivery instructions',
      redirect: 'Redirect this package',
      updates: 'Get shipment updates',
    };
    return (
      <div className="min-h-screen bg-[#f7f7f7]">
        <div className="max-w-[720px] mx-auto px-4 py-10">
          <h1 className="text-3xl font-light mb-2">{titles[action] || 'Delivery Manager'}</h1>
          <p className="text-gray-600 mb-6">Sign in to complete this request.</p>
          <Button asChild className="bg-[#4D148C] text-white"><Link to="/login">Sign in</Link></Button>
        </div>
      </div>
    );
  }

  const selected = HOLD_REASONS.find((r) => r.id === reasonId) || HOLD_REASONS[0];
  const fullReason = reasonText(reasonId, customReason);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signedIn) {
      toast.error('Sign in to request a hold');
      window.location.href = `/login?next=/delivery-manager/hold?number=${encodeURIComponent(number)}`;
      return;
    }
    if (!number.trim() || !locationName.trim()) {
      toast.error('Enter tracking number and hold location');
      return;
    }
    if (!fullReason) {
      toast.error('Choose a reason or type your own');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          number: number.trim(),
          location: locationName.trim(),
          email: user?.email || '',
          reason: fullReason,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || 'Could not request hold');
        return;
      }
      toast.success('Hold requested. Staff will approve it in Admin.');
    } catch {
      toast.error('Could not reach hold service');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <h1 className="text-3xl font-light mb-2">Hold at a FedEx location</h1>
        <p className="text-gray-600 mb-6">Ask staff to hold this package for pickup. Choose a reason from the list, or type your own.</p>
        {!signedIn && (
          <p className="mb-4 text-sm">You must <Link className="text-[#007AB8] underline" to={`/login?next=/delivery-manager/hold?number=${encodeURIComponent(number)}`}>sign in</Link> first.</p>
        )}
        <form onSubmit={submit} className="bg-white border rounded-lg p-6 space-y-4 max-w-xl">
          <Input placeholder="Tracking number" value={number} onChange={(e) => setNumber(e.target.value)} />
          <Input placeholder="Hold location (FedEx Office or Ship Center)" value={locationName} onChange={(e) => setLocationName(e.target.value)} />

          <div>
            <label className="text-sm font-medium text-gray-700">Hold reason</label>
            <select
              className="mt-1 w-full border rounded h-10 px-2"
              value={reasonId}
              onChange={(e) => setReasonId(e.target.value)}
            >
              {HOLD_REASONS.map((r) => (
                <option key={r.id} value={r.id}>{r.label}</option>
              ))}
            </select>
            {selected.id !== 'other' && selected.full && (
              <p className="mt-2 text-sm text-gray-600">{selected.full}</p>
            )}
          </div>

          {reasonId === 'other' && (
            <div>
              <label className="text-sm font-medium text-gray-700">Type your reason</label>
              <textarea
                className="mt-1 w-full border rounded p-2 min-h-24 text-sm"
                placeholder="Explain why this package should be held"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
              />
            </div>
          )}

          {fullReason && (
            <div className="bg-[#f7f7f7] border rounded p-3 text-sm">
              <p className="font-medium mb-1">Reason that will be saved</p>
              <p className="text-gray-700">{fullReason}</p>
            </div>
          )}

          <Button type="submit" disabled={busy} className="bg-[#4D148C] text-white">{busy ? 'Submitting…' : 'Request hold'}</Button>
        </form>
        <div className="mt-4">
          <Button asChild variant="outline"><Link to={number ? `/tracking?number=${encodeURIComponent(number)}` : '/tracking'}>Back to tracking</Link></Button>
        </div>
      </div>
    </div>
  );
}
