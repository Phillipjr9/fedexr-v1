import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { apiListActivity } from '@/lib/adminApi';

export default function AdminActivity() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiListActivity()
      .then(setRows)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white border rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-2">Activity log</h1>
      <p className="text-sm text-gray-500 mb-6">Recent admin actions from Neon.</p>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !rows.length ? (
        <p className="text-sm text-gray-500">No activity yet.</p>
      ) : (
        <ul className="divide-y text-sm">
          {rows.map((r) => (
            <li key={r.id} className="py-3">
              <p className="font-medium">{r.action}</p>
              <p className="text-gray-600">{r.detail}</p>
              <p className="text-xs text-gray-400">{r.at ? new Date(r.at).toLocaleString() : ''}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
