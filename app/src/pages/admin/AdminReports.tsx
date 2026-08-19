import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { apiListActivity, apiListShipments, apiListUsers } from '@/lib/adminApi';
import { Download } from 'lucide-react';

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminReports() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [activity, setActivity] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([apiListShipments(), apiListUsers(), apiListActivity()])
      .then(([s, u, a]) => {
        setShipments(s);
        setUsers(u);
        setActivity(a);
      })
      .catch((err) => toast.error(err.message));
  }, []);

  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of shipments) map[s.status || 'Unknown'] = (map[s.status || 'Unknown'] || 0) + 1;
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [shipments]);

  const exportShipments = () => {
    const rows = [
      ['tracking_number', 'status', 'origin', 'destination', 'service', 'location', 'fee', 'package_size'],
      ...shipments.map((s) => [
        s.number, s.status, s.origin, s.destination, s.service, s.location,
        s.shippingFee != null ? String(s.shippingFee) : '', s.packageSize || '',
      ]),
    ];
    downloadCsv(`shipments-${new Date().toISOString().slice(0, 10)}.csv`, rows);
    toast.success('Shipments CSV downloaded');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-gray-500">Live totals from Neon (tracking operations).</p>
        </div>
        <Button type="button" className="bg-[#4D148C] text-white" onClick={exportShipments}>
          <Download className="h-4 w-4 mr-2" /> Export shipments CSV
        </Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500">Shipments</p>
          <p className="text-3xl font-semibold text-[#4D148C]">{shipments.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500">Customer accounts</p>
          <p className="text-3xl font-semibold text-[#4D148C]">{users.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-5">
          <p className="text-sm text-gray-500">Disabled accounts</p>
          <p className="text-3xl font-semibold text-[#4D148C]">{users.filter((u) => u.disabled).length}</p>
        </div>
      </div>
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-3">Shipments by status</h2>
        <ul className="space-y-2 text-sm">
          {byStatus.map(([status, count]) => (
            <li key={status} className="flex justify-between border-b py-2">
              <span>{status}</span>
              <span className="font-medium">{count}</span>
            </li>
          ))}
          {!byStatus.length && <li className="text-gray-500">No data</li>}
        </ul>
      </div>
      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-3">Latest activity</h2>
        <ul className="space-y-2 text-sm">
          {activity.slice(0, 10).map((a) => (
            <li key={a.id} className="border-b py-2">
              <span className="font-medium">{a.action}</span> — {a.detail}
            </li>
          ))}
          {!activity.length && <li className="text-gray-500">No activity</li>}
        </ul>
      </div>
    </div>
  );
}
