import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function DeliveryManagerActionPage() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const action = pathname.split('/').pop() || 'hold';
  const [number, setNumber] = useState(params.get('number') || '');
  const [locationName, setLocationName] = useState('');
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
    setBusy(true);
    try {
      const res = await fetch('/api/holds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: number.trim(), location: locationName.trim(), email: user?.email || '' }),
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
        <p className="text-gray-600 mb-6">Ask staff to hold this package for pickup. The status becomes “Held at location” after an admin approves it.</p>
        {!signedIn && (
          <p className="mb-4 text-sm">You must <Link className="text-[#007AB8] underline" to={`/login?next=/delivery-manager/hold?number=${encodeURIComponent(number)}`}>sign in</Link> first.</p>
        )}
        <form onSubmit={submit} className="bg-white border rounded-lg p-6 space-y-3 max-w-md">
          <Input placeholder="Tracking number" value={number} onChange={(e) => setNumber(e.target.value)} />
          <Input placeholder="Hold location (FedEx Office or Ship Center)" value={locationName} onChange={(e) => setLocationName(e.target.value)} />
          <Button type="submit" disabled={busy} className="bg-[#4D148C] text-white">{busy ? 'Submitting…' : 'Request hold'}</Button>
        </form>
        <div className="mt-4">
          <Button asChild variant="outline"><Link to={number ? `/tracking?number=${encodeURIComponent(number)}` : '/tracking'}>Back to tracking</Link></Button>
        </div>
      </div>
    </div>
  );
}
