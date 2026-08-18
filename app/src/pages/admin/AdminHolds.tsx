import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

function headers() {
  return { 'Content-Type': 'application/json', 'x-admin-secret': localStorage.getItem('adminPassword') || '' };
}

export default function AdminHolds() {
  const [holds, setHolds] = useState<any[]>([]);

  const refresh = async () => {
    const res = await fetch('/api/holds', { headers: headers() });
    if (!res.ok) throw new Error('Could not load holds');
    const json = await res.json();
    setHolds(json.holds || []);
  };

  useEffect(() => {
    refresh().catch((err) => toast.error(err.message));
  }, []);

  const setStatus = async (id: number, status: string) => {
    const res = await fetch('/api/holds', {
      method: 'PATCH',
      headers: headers(),
      body: JSON.stringify({ id, status }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(json.error || 'Update failed');
      return;
    }
    toast.success(`Hold ${status}`);
    refresh();
  };

  return (
    <div className="bg-white border rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-2">Hold requests</h1>
      <p className="text-sm text-gray-500 mb-6">Approve to set shipment status to Held at location. Full customer reason is shown below each request.</p>
      <ul className="divide-y text-sm">
        {holds.map((h) => (
          <li key={h.id} className="py-4 flex flex-wrap justify-between gap-3">
            <div className="max-w-xl">
              <p className="font-medium">{h.tracking_number}</p>
              <p className="text-gray-600">{h.location_name}</p>
              {h.reason && <p className="mt-2 text-gray-800">{h.reason}</p>}
              <p className="text-xs text-gray-400 mt-1">{h.status} · {h.customer_email || 'no email'} · {h.created_at ? new Date(h.created_at).toLocaleString() : ''}</p>
            </div>
            <div className="flex gap-2 h-fit">
              {h.status === 'requested' && (
                <>
                  <Button type="button" className="bg-[#4D148C] text-white" onClick={() => setStatus(h.id, 'approved')}>Approve</Button>
                  <Button type="button" variant="outline" onClick={() => setStatus(h.id, 'declined')}>Decline</Button>
                </>
              )}
              {h.status === 'approved' && (
                <Button type="button" variant="outline" onClick={() => setStatus(h.id, 'released')}>Release hold</Button>
              )}
            </div>
          </li>
        ))}
        {!holds.length && <li className="py-6 text-gray-500">No hold requests.</li>}
      </ul>
    </div>
  );
}
