import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiDeleteUser, apiListUsers, apiSetUserDisabled } from '@/lib/adminApi';

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    try {
      setUsers(await apiListUsers());
    } catch (err: any) {
      toast.error(err.message || 'Could not load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="bg-white border rounded-lg p-6">
      <h1 className="text-xl font-semibold mb-2">Customer accounts</h1>
      <p className="text-sm text-gray-500 mb-6">Disable or delete accounts created on /login.</p>
      {loading ? (
        <p className="text-sm text-gray-500">Loading…</p>
      ) : !users.length ? (
        <p className="text-sm text-gray-500">No customer accounts yet.</p>
      ) : (
        <ul className="divide-y">
          {users.map((u) => (
            <li key={u.id} className="py-3 flex flex-wrap justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{u.name || 'No name'}</p>
                <p className="text-gray-500">{u.email}</p>
                <p className="text-xs text-gray-400">{u.disabled ? 'Disabled' : 'Active'} · #{u.id}</p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await apiSetUserDisabled(u.id, !u.disabled);
                    toast.success(u.disabled ? 'User enabled' : 'User disabled');
                    refresh();
                  }}
                >
                  {u.disabled ? 'Enable' : 'Disable'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!confirm(`Delete ${u.email}?`)) return;
                    await apiDeleteUser(u.id);
                    toast.success('User deleted');
                    refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
