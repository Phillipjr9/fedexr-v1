import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SHIPMENT_STATUSES, type ShipmentStatus } from '@/lib/adminStore';
import { apiDeleteShipment, apiListShipments, apiSaveShipment, apiUploadImage } from '@/lib/adminApi';

const emptyForm = {
  number: '',
  status: 'In transit' as ShipmentStatus,
  origin: '',
  destination: '',
  service: 'FedEx Ground',
  estimatedDelivery: '',
  location: '',
  setupImage: '',
  deliveredImage: '',
};

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function validate(form: typeof emptyForm) {
  const errors: Record<string, string> = {};
  const number = form.number.trim();
  if (!number) errors.number = 'Tracking number is required.';
  else if (!/^[A-Za-z0-9]{10,22}$/.test(number)) errors.number = 'Use 10–22 letters or numbers only.';
  if (!form.origin.trim()) errors.origin = 'Origin is required.';
  if (!form.destination.trim()) errors.destination = 'Destination is required.';
  if (!form.location.trim()) errors.location = 'Scan location is required.';
  if (!form.estimatedDelivery.trim()) errors.estimatedDelivery = 'Estimated delivery is required.';
  if (form.deliveredImage && form.status !== 'Delivered') {
    errors.deliveredImage = 'A delivery photo can only be saved when status is Delivered.';
  }
  return errors;
}

export default function AdminShipments() {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shipments, setShipments] = useState<any[]>([]);
  const [query, setQuery] = useState('');

  const refresh = async () => {
    try { setShipments(await apiListShipments()); }
    catch (err: any) { toast.error(err.message || 'Could not load shipments'); }
  };
  useEffect(() => { refresh(); }, []);

  const readImage = (file: File, slot: 'setup' | 'delivered') => {
    if (!ALLOWED.includes(file.type)) { toast.error('Use JPEG, PNG, WebP, or GIF'); return; }
    if (file.size > MAX_IMAGE_BYTES) { toast.error('Image must be under 2MB'); return; }
    const reader = new FileReader();
    reader.onload = () => setForm((f) => ({ ...f, [slot === 'setup' ? 'setupImage' : 'deliveredImage']: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) { toast.error('Fix the highlighted fields'); return; }
    try {
      await apiSaveShipment({
        number: form.number.trim(),
        status: form.status,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        service: form.service,
        estimatedDelivery: form.estimatedDelivery,
        currentLocation: form.location.trim(),
      });
      if (form.setupImage) await apiUploadImage(form.number.trim(), 'setup', form.setupImage);
      if (form.deliveredImage && form.status === 'Delivered') await apiUploadImage(form.number.trim(), 'delivered', form.deliveredImage);
      toast.success('Shipment saved to Neon');
      setForm(emptyForm);
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    }
  };

  const filtered = shipments.filter((s) => `${s.number} ${s.origin} ${s.destination} ${s.status}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="grid lg:grid-cols-2 gap-8">
      <form onSubmit={save} className="bg-white border rounded-lg p-6 space-y-3">
        <h1 className="text-xl font-semibold">Create / update shipment</h1>
        <Input placeholder="Tracking number" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
        {errors.number && <p className="text-sm text-red-600">{errors.number}</p>}
        <select className="w-full border rounded h-9 px-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ShipmentStatus })}>
          {SHIPMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <Input placeholder="Origin" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
        {errors.origin && <p className="text-sm text-red-600">{errors.origin}</p>}
        <Input placeholder="Destination" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} />
        {errors.destination && <p className="text-sm text-red-600">{errors.destination}</p>}
        <Input placeholder="Service" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} />
        <Input placeholder="Scan location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        {errors.location && <p className="text-sm text-red-600">{errors.location}</p>}
        <Input placeholder="Estimated delivery" value={form.estimatedDelivery} onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })} />
        <div>
          <p className="text-sm font-medium">Setup / in-transit photo (optional)</p>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], 'setup')} />
        </div>
        <div>
          <p className="text-sm font-medium">Delivered photo (optional, only if Delivered)</p>
          <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], 'delivered')} />
          {errors.deliveredImage && <p className="text-sm text-red-600">{errors.deliveredImage}</p>}
        </div>
        <Button type="submit" className="bg-[#4D148C] text-white">Save to Neon</Button>
      </form>
      <div className="bg-white border rounded-lg p-6">
        <Input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="mb-4" />
        <ul className="divide-y">
          {filtered.map((s) => (
            <li key={s.number} className="py-3 flex justify-between gap-3 text-sm">
              <div>
                <p className="font-medium">{s.number}</p>
                <p className="text-gray-500">{s.status} · {s.origin} → {s.destination}</p>
              </div>
              <Button type="button" variant="outline" onClick={async () => { await apiDeleteShipment(s.number); toast.success('Deleted'); refresh(); }}>Delete</Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
