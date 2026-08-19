import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SHIPMENT_STATUSES, type ShipmentStatus } from '@/lib/adminStore';
import { FEDEX_SERVICES, generateTrackingNumber, suggestPlaces } from '@/lib/places';
import {
  apiAddEvent,
  apiDeleteShipment,
  apiListShipments,
  apiSaveShipment,
  apiUploadImage,
} from '@/lib/adminApi';
import { RefreshCw } from 'lucide-react';

const emptyForm = {
  number: '',
  status: 'Label created' as ShipmentStatus,
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

function PlaceInput({
  label,
  value,
  onChange,
  error,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => suggestPlaces(value), [value]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <Input
        placeholder={placeholder || 'Start typing city…'}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        autoComplete="off"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto text-sm">
          {suggestions.map((s) => (
            <li key={s}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-purple-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s);
                  setOpen(false);
                }}
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function validate(form: typeof emptyForm) {
  const errors: Record<string, string> = {};
  if (!form.number.trim()) errors.number = 'Tracking number is required.';
  if (!form.origin.trim()) errors.origin = 'Origin is required.';
  if (!form.destination.trim()) errors.destination = 'Destination is required.';
  if (!form.location.trim()) errors.location = 'Current / scan location is required.';
  if (!form.estimatedDelivery.trim()) errors.estimatedDelivery = 'Estimated delivery is required.';
  if (form.deliveredImage && form.status !== 'Delivered') {
    errors.deliveredImage = 'A delivery photo can only be saved when status is Delivered.';
  }
  return errors;
}

export default function AdminShipments() {
  const [form, setForm] = useState(() => ({ ...emptyForm, number: generateTrackingNumber() }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shipments, setShipments] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [eventForm, setEventForm] = useState({ number: '', status: 'In transit', location: '', details: '' });
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      setShipments(await apiListShipments());
    } catch (err: any) {
      toast.error(err.message || 'Could not load shipments');
    }
  };
  useEffect(() => {
    refresh();
  }, []);

  const readImage = (file: File, slot: 'setup' | 'delivered') => {
    if (!ALLOWED.includes(file.type)) {
      toast.error('Use JPEG, PNG, WebP, or GIF');
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast.error('Image must be under 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () =>
      setForm((f) => ({
        ...f,
        [slot === 'setup' ? 'setupImage' : 'deliveredImage']: String(reader.result),
      }));
    reader.readAsDataURL(file);
  };

  const loadIntoForm = (s: any) => {
    setForm({
      number: s.number || '',
      status: (s.status as ShipmentStatus) || 'Label created',
      origin: s.origin || '',
      destination: s.destination || '',
      service: s.service || 'FedEx Ground',
      estimatedDelivery: s.estimatedDelivery || '',
      location: s.location || '',
      setupImage: '',
      deliveredImage: '',
    });
    setEventForm({ number: s.number || '', status: s.status || 'In transit', location: s.location || '', details: '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast.message(`Editing ${s.number}`);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) {
      toast.error('Fix the highlighted fields');
      return;
    }
    setBusy(true);
    try {
      await apiSaveShipment({
        number: form.number.trim(),
        status: form.status,
        origin: form.origin.trim(),
        destination: form.destination.trim(),
        service: form.service,
        estimatedDelivery: form.estimatedDelivery,
        location: form.location.trim(),
      });
      if (form.setupImage) await apiUploadImage(form.number.trim(), form.setupImage, 'setup');
      if (form.deliveredImage && form.status === 'Delivered') {
        await apiUploadImage(form.number.trim(), form.deliveredImage, 'delivered');
      }
      toast.success('Shipment saved');
      setForm({ ...emptyForm, number: generateTrackingNumber() });
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    } finally {
      setBusy(false);
    }
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.number.trim() || !eventForm.location.trim() || !eventForm.status) {
      toast.error('Tracking number, status, and location are required');
      return;
    }
    try {
      await apiAddEvent({
        number: eventForm.number.trim(),
        status: eventForm.status,
        location: eventForm.location.trim(),
        details: eventForm.details.trim(),
      });
      toast.success('Scan event added');
      setEventForm({ number: eventForm.number, status: 'In transit', location: '', details: '' });
      await refresh();
    } catch (err: any) {
      toast.error(err.message || 'Could not add event');
    }
  };

  const filtered = shipments.filter((s) =>
    `${s.number} ${s.origin} ${s.destination} ${s.status} ${s.service}`
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="grid lg:grid-cols-2 gap-8">
        <form onSubmit={save} className="bg-white border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold">Create / update shipment</h1>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm((f) => ({ ...f, number: generateTrackingNumber() }))}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              New tracking #
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tracking number (auto)</label>
            <Input value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} className="font-mono" />
            <p className="text-xs text-gray-500 mt-1">Generated automatically — you can still edit if needed.</p>
            {errors.number && <p className="text-sm text-red-600">{errors.number}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded h-10 px-2"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ShipmentStatus })}
            >
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service type</label>
            <select
              className="w-full border rounded h-10 px-2"
              value={form.service}
              onChange={(e) => setForm({ ...form, service: e.target.value })}
            >
              {FEDEX_SERVICES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <PlaceInput
            label="Origin"
            value={form.origin}
            onChange={(origin) => setForm({ ...form, origin })}
            error={errors.origin}
            placeholder="e.g. Los Angeles, CA US"
          />
          <PlaceInput
            label="Destination"
            value={form.destination}
            onChange={(destination) => setForm({ ...form, destination })}
            error={errors.destination}
            placeholder="e.g. New York, NY US"
          />
          <PlaceInput
            label="Current / scan location"
            value={form.location}
            onChange={(location) => setForm({ ...form, location })}
            error={errors.location}
            placeholder="Where the package is now"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated delivery</label>
            <Input
              placeholder="Today · By end of day · Apr 8, 2026"
              value={form.estimatedDelivery}
              onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })}
            />
            {errors.estimatedDelivery && <p className="text-sm text-red-600">{errors.estimatedDelivery}</p>}
          </div>

          <div>
            <p className="text-sm font-medium">Setup / in-transit photo (optional)</p>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], 'setup')} />
            {form.setupImage && <p className="text-xs text-green-700 mt-1">Photo ready to upload</p>}
          </div>
          <div>
            <p className="text-sm font-medium">Delivered photo (optional — only when Delivered)</p>
            <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && readImage(e.target.files[0], 'delivered')} />
            {errors.deliveredImage && <p className="text-sm text-red-600">{errors.deliveredImage}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={busy} className="bg-[#4D148C] text-white">
              {busy ? 'Saving…' : 'Save to Neon'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setForm({ ...emptyForm, number: generateTrackingNumber() })}
            >
              Clear
            </Button>
          </div>
        </form>

        <form onSubmit={addEvent} className="bg-white border rounded-lg p-6 space-y-3">
          <h2 className="text-xl font-semibold">Add scan event</h2>
          <p className="text-sm text-gray-500">Append travel history without rewriting the whole shipment.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tracking number</label>
            <Input
              list="shipment-numbers"
              value={eventForm.number}
              onChange={(e) => setEventForm({ ...eventForm, number: e.target.value })}
              placeholder="Select or paste"
            />
            <datalist id="shipment-numbers">
              {shipments.map((s) => (
                <option key={s.number} value={s.number} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded h-10 px-2"
              value={eventForm.status}
              onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
            >
              {SHIPMENT_STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <PlaceInput
            label="Scan location"
            value={eventForm.location}
            onChange={(location) => setEventForm({ ...eventForm, location })}
          />
          <Input
            placeholder="Details (optional)"
            value={eventForm.details}
            onChange={(e) => setEventForm({ ...eventForm, details: e.target.value })}
          />
          <Button type="submit" className="bg-[#4D148C] text-white">
            Add event
          </Button>
        </form>
      </div>

      <div className="bg-white border rounded-lg p-6">
        <div className="flex flex-wrap gap-3 mb-4 items-center justify-between">
          <h2 className="text-lg font-semibold">All shipments ({filtered.length})</h2>
          <Input placeholder="Search" value={query} onChange={(e) => setQuery(e.target.value)} className="max-w-xs" />
        </div>
        <ul className="divide-y">
          {filtered.map((s) => (
            <li key={s.number} className="py-3 flex flex-wrap justify-between gap-3 text-sm">
              <div>
                <p className="font-medium font-mono">{s.number}</p>
                <p className="text-gray-500">
                  {s.status} · {s.service} · {s.origin} → {s.destination}
                </p>
                <p className="text-xs text-gray-400">
                  {(s.history?.length || 0)} scans · setup photo: {s.hasSetupImage ? 'yes' : 'no'} · delivered
                  photo: {s.hasDeliveredImage ? 'yes' : 'no'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => loadIntoForm(s)}>
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={async () => {
                    if (!confirm(`Delete ${s.number}?`)) return;
                    await apiDeleteShipment(s.number);
                    toast.success('Deleted');
                    refresh();
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
          {!filtered.length && <li className="py-6 text-gray-500">No shipments yet — create one above.</li>}
        </ul>
      </div>
    </div>
  );
}
