import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, AlertTriangle, CheckCircle2, Plus, Search } from 'lucide-react';
import { apiListShipments } from '@/lib/adminApi';
import { getBanner } from '@/lib/adminStore';

export default function AdminDashboard() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const banner = useMemo(() => getBanner(), []);

  useEffect(() => {
    apiListShipments()
      .then((rows) => setShipments(rows || []))
      .catch((err) => setError(err.message || 'Could not load shipments from Neon'))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { total: shipments.length, transit: 0, delivered: 0, exception: 0 };
    for (const s of shipments) {
      const st = String(s.status || '').toLowerCase();
      if (st.includes('deliver')) c.delivered += 1;
      else if (st.includes('exception') || st.includes('held')) c.exception += 1;
      else c.transit += 1;
    }
    return c;
  }, [shipments]);

  const recent = shipments.slice(0, 8);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#4D148C]">Operations</p>
          <h1 className="text-2xl font-semibold text-gray-900">Admin dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Shipments, photos, statuses, and the public banner — stored in Neon.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/shipments" className="inline-flex items-center gap-2 bg-[#4D148C] text-white px-4 py-2 rounded text-sm">
            <Plus className="h-4 w-4" /> New shipment
          </Link>
          <Link to="/tracking" className="inline-flex items-center gap-2 border px-4 py-2 rounded text-sm">
            <Search className="h-4 w-4" /> Public track
          </Link>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { label: 'All shipments', value: counts.total, icon: Package },
          { label: 'In network', value: counts.transit, icon: Truck },
          { label: 'Delivered', value: counts.delivered, icon: CheckCircle2 },
          { label: 'Exceptions', value: counts.exception, icon: AlertTriangle },
        ].map((card) => (
          <div key={card.label} className="bg-white border rounded-lg p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{card.label}</p>
              <card.icon className="h-4 w-4 text-[#4D148C]" />
            </div>
            <p className="text-3xl font-semibold text-[#4D148C] mt-2">{loading ? '—' : card.value}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
          {error}. Check DATABASE_URL and that you signed in with the env admin password.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border rounded-lg">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h2 className="font-medium">Recent shipments</h2>
            <Link to="/admin/shipments" className="text-sm text-[#007AB8]">Manage all</Link>
          </div>
          {loading ? (
            <p className="p-5 text-sm text-gray-500">Loading from Neon…</p>
          ) : recent.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 mb-3">No shipments yet.</p>
              <Link to="/admin/shipments" className="text-[#4D148C] font-medium">Create the first tracking number</Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b">
                <tr>
                  <th className="px-5 py-2">Tracking</th>
                  <th className="px-5 py-2">Status</th>
                  <th className="px-5 py-2 hidden md:table-cell">Route</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.number} className="border-b last:border-0">
                    <td className="px-5 py-3 font-medium">{s.number}</td>
                    <td className="px-5 py-3">{s.status}</td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-500">{s.origin} → {s.destination}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-medium mb-2">Homepage banner</h2>
            <p className="text-sm text-gray-600 mb-3">{banner.enabled ? banner.message : 'Banner is hidden on the public site.'}</p>
            <Link to="/admin/banner" className="text-sm text-[#007AB8]">Edit banner</Link>
          </div>
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-medium mb-2">Quick actions</h2>
            <ul className="text-sm space-y-2">
              <li><Link to="/admin/shipments" className="text-[#007AB8]">Add tracking + photos</Link></li>
              <li><Link to="/admin/banner" className="text-[#007AB8]">Change alert banner</Link></li>
              <li><Link to="/admin/settings" className="text-[#007AB8]">Admin settings</Link></li>
              <li><Link to="/" className="text-[#007AB8]">View public homepage</Link></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
