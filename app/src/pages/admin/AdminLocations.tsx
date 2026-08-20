import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiDeleteLocation, apiListLocations, apiSaveLocation } from '@/lib/adminApi';

export default function AdminLocations() {
  const [rows, setRows] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', address: '', hours: '', phone: '', services: '' });

  const refresh = async () => {
    try {
      setRows(await apiListLocations(true));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiSaveLocation(form);
      toast.success('Location saved');
      setForm({ name: '', address: '', hours: '', phone: '', services: '' });
      refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <form onSubmit={save} className="bg-white border rounded-lg p-6 space-y-3">
        <h1 className="text-xl font-semibold">Add location</h1>
        <Input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
        <Input placeholder="Hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} />
        <Input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Input placeholder="Services" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} />
        <Button type="submit" className="bg-[#4D148C] text-white">Save location</Button>
      </form>
      <div className="bg-white border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Locations</h2>
        <ul className="divide-y text-sm">
          {rows.map((l) => (
            <li key={l.id} className="py-3 flex justify-between gap-3">
              <div>
                <p className="font-medium">{l.name}</p>
                <p className="text-gray-500">{l.address}</p>
                <p className="text-xs text-gray-400">{l.active ? 'Active' : 'Inactive'}</p>
              </div>
              {l.active ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    await apiDeleteLocation(l.id);
                    toast.success('Deactivated');
                    refresh();
                  }}
                >
                  Deactivate
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="text-green-800 border-green-300"
                  onClick={async () => {
                    await apiSaveLocation({ id: String(l.id), active: 'true' } as any);
                    toast.success('Reactivated');
                    refresh();
                  }}
                >
                  Reactivate
                </Button>
              )}
            </li>
          ))}
          {!rows.length && <li className="py-6 text-gray-500">No locations yet.</li>}
        </ul>
      </div>
    </div>
  );
}
