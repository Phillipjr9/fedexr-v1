import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiDeleteUser, apiListUsers, apiSetUserApproved, apiSetUserDisabled } from '@/lib/adminApi';

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

  const pending = users.filter((u) => !u.approved && !u.disabled);

  return (
    <div className="bg-white border rounded-lg p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold mb-2">Customer accounts</h1>
        <p className="text-sm text-gray-500">
          New signups stay pending until you approve them. Only approved accounts can sign in and use the dashboard.
        </p>
      </div>

      {pending.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-semibold text-amber-900 mb-2">
            {pending.length} waiting for approval
          </p>
          <ul className="divide-y divide-amber-100">
            {pending.map((u) => (
              <li key={u.id} className="py-3 flex flex-wrap justify-between gap-3 text-sm">
                <div>
                  <p className="font-medium">{u.name || 'No name'}</p>
                  <p className="text-gray-600">{u.email}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    className="bg-[#00843D] text-white hover:bg-[#006b32]"
                    onClick={async () => {
                      await apiSetUserApproved(u.id, true);
                      toast.success(`Approved ${u.email}`);
                      refresh();
                    }}
                  >
                    Approve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-700 border-red-200"
                    onClick={async () => {
                      if (!confirm(`Reject and delete ${u.email}?`)) return;
                      await apiDeleteUser(u.id);
                      toast.success('Signup rejected');
                      refresh();
                    }}
                  >
                    Reject
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

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
                <p className="text-xs text-gray-400">
                  {u.status || (u.disabled ? 'Disabled' : u.approved ? 'Approved' : 'Pending approval')} · #{u.id}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!u.approved && !u.disabled && (
                  <Button
                    type="button"
                    className="bg-[#00843D] text-white"
                    onClick={async () => {
                      await apiSetUserApproved(u.id, true);
                      toast.success('User approved');
                      refresh();
                    }}
                  >
                    Approve
                  </Button>
                )}
                {u.approved && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      await apiSetUserApproved(u.id, false);
                      toast.success('Approval revoked');
                      refresh();
                    }}
                  >
                    Revoke access
                  </Button>
                )}
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
