import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, AlertTriangle, CheckCircle2, Plus, Search, PauseCircle, Camera } from 'lucide-react';
import { apiGetBanner, apiListHolds, apiListShipments } from '@/lib/adminApi';

export default function AdminDashboard() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [holds, setHolds] = useState<any[]>([]);
  const [banner, setBanner] = useState<{ enabled: boolean; message: string; linkText: string; linkHref: string } | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiListShipments(),
      apiListHolds().catch(() => []),
      apiGetBanner().catch(() => null),
    ])
      .then(([rows, holdRows, b]) => {
        setShipments(rows || []);
        setHolds(holdRows || []);
        setBanner(b);
      })
      .catch((err) => setError(err.message || 'Could not load data from Neon'))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c = { total: shipments.length, transit: 0, delivered: 0, exception: 0, withPhoto: 0 };
    for (const s of shipments) {
      const st = String(s.status || '').toLowerCase();
      if (st.includes('deliver') && !st.includes('out')) c.delivered += 1;
      else if (st.includes('exception') || st.includes('held')) c.exception += 1;
      else c.transit += 1;
      if (s.hasSetupImage || s.hasDeliveredImage || s.hasTransitImage) c.withPhoto += 1;
    }
    const openHolds = holds.filter((h) => h.status === 'requested' || h.status === 'approved').length;
    return { ...c, openHolds };
  }, [shipments, holds]);

  const recent = shipments.slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#4D148C]">Operations</p>
          <h1 className="text-2xl font-semibold text-gray-900">Admin dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Shipments, photos, holds, and the public banner — stored in Neon.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/shipments" className="inline-flex items-center gap-2 bg-[#4D148C] text-white px-4 py-2 rounded text-sm font-medium">
            <Plus className="h-4 w-4" /> New shipment
          </Link>
          <Link to="/tracking" className="inline-flex items-center gap-2 border border-gray-300 bg-white text-gray-800 px-4 py-2 rounded text-sm font-medium">
            <Search className="h-4 w-4" /> Public track
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-lg p-4 space-y-1">
          <p className="font-semibold">Could not load admin data</p>
          <p>{error}</p>
          <p className="text-red-700/80">Check Vercel env: DATABASE_URL (or NEON_DATABASE_URL), ADMIN_USERNAME, ADMIN_PASSWORD. Then redeploy and sign in again.</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {[
          { label: 'All shipments', value: counts.total, icon: Package },
          { label: 'In network', value: counts.transit, icon: Truck },
          { label: 'Delivered', value: counts.delivered, icon: CheckCircle2 },
          { label: 'Exceptions / held', value: counts.exception, icon: AlertTriangle },
          { label: 'Open holds', value: counts.openHolds, icon: PauseCircle },
          { label: 'With photos', value: counts.withPhoto, icon: Camera },
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
                  <th className="px-5 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((s) => (
                  <tr key={s.number} className="border-b last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium font-mono text-xs sm:text-sm">{s.number}</td>
                    <td className="px-5 py-3">{s.status}</td>
                    <td className="px-5 py-3 hidden md:table-cell text-gray-500">{s.origin} → {s.destination}</td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/admin/shipments?edit=${encodeURIComponent(s.number)}`}
                        className="text-[#007AB8] font-medium"
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-medium mb-2">Homepage banner</h2>
            <p className="text-sm text-gray-600 mb-3">
              {banner
                ? banner.enabled
                  ? banner.message || 'Banner enabled (empty message)'
                  : 'Banner is hidden on the public site.'
                : loading
                  ? 'Loading…'
                  : 'Could not load banner from Neon.'}
            </p>
            <Link to="/admin/banner" className="text-sm text-[#007AB8]">Edit banner</Link>
          </div>
          <div className="bg-white border rounded-lg p-5">
            <h2 className="font-medium mb-2">Quick actions</h2>
            <ul className="text-sm space-y-2">
              <li><Link to="/admin/shipments" className="text-[#007AB8]">Add tracking + photos</Link></li>
              <li><Link to="/admin/holds" className="text-[#007AB8]">Review holds ({counts.openHolds} open)</Link></li>
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
