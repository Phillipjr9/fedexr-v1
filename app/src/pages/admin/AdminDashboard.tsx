import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getActivity, getBanner, getShipments } from '@/lib/adminStore';

export default function AdminDashboard() {
  const shipments = useMemo(() => getShipments(), []);
  const banner = useMemo(() => getBanner(), []);
  const activity = useMemo(() => getActivity().slice(0, 8), []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Manage tracking, images, statuses, and the homepage banner.</p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-5">
          <p className="text-sm text-gray-500">Shipments</p>
          <p className="text-3xl font-semibold text-[#4D148C] mt-1">{shipments.length}</p>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <p className="text-sm text-gray-500">Banner</p>
          <p className="text-3xl font-semibold text-[#4D148C] mt-1">{banner.enabled ? 'On' : 'Off'}</p>
        </div>
        <div className="bg-white rounded-lg border p-5">
          <p className="text-sm text-gray-500">Recent actions</p>
          <p className="text-3xl font-semibold text-[#4D148C] mt-1">{activity.length}</p>
        </div>
      </div>
      <div className="flex gap-3">
        <Link to="/admin/shipments" className="bg-[#4D148C] text-white px-4 py-2 rounded text-sm">Manage shipments</Link>
        <Link to="/admin/banner" className="border px-4 py-2 rounded text-sm">Edit banner</Link>
      </div>
    </div>
  );
}
