import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SHIPMENT_STATUSES, type ShipmentStatus } from '@/lib/adminStore';
import { FEDEX_SERVICES, generateTrackingNumber, geocodePlaces } from '@/lib/places';
import { apiAddEvent, apiDeleteShipment, apiListShipments, apiSaveShipment, apiUploadImage } from '@/lib/adminApi';
import { Check, ChevronRight, Copy, RefreshCw } from 'lucide-react';

function etaForService(service: string) {
  const days =
    /first|same/i.test(service) ? 0 :
    /priority overnight|standard overnight/i.test(service) ? 1 :
    /2day/i.test(service) ? 2 :
    /saver/i.test(service) ? 3 :
    /international/i.test(service) ? 6 : 5;
  const d = new Date();
  d.setDate(d.getDate() + days);
  if (days === 0) return 'Today · By end of day';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
}

function statusRank(status: string) {
  const s = status.toLowerCase();
  if (s.includes('deliver') && !s.includes('out')) return 4;
  if (s.includes('out for')) return 3;
  if (s.includes('transit') || s.includes('way') || s.includes('facility')) return 2;
  if (s.includes('pick') || s.includes('have')) return 1;
  return 0;
}

function PlaceInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) { setSuggestions([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try { setSuggestions(await geocodePlaces(q)); } catch { setSuggestions([]); }
      finally { setLoading(false); }
    }, 280);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <Input value={value} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} autoComplete="off" placeholder="Type a city" />
      {open && (loading || suggestions.length > 0) && (
        <ul className="absolute z-20 mt-1 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto text-sm">
          {loading && <li className="px-3 py-2 text-gray-400">Searching…</li>}
          {suggestions.map((s) => (
            <li key={s}><button type="button" className="w-full text-left px-3 py-2 hover:bg-purple-50" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(s); setOpen(false); }}>{s}</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminShipments() {
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [form, setForm] = useState({
    number: generateTrackingNumber(),
    origin: '',
    destination: '',
    service: 'FedEx Ground',
    status: 'In transit' as ShipmentStatus,
    estimatedDelivery: etaForService('FedEx Ground'),
    location: '',
    setupImage: '',
    deliveredImage: '',
  });

  const refresh = async () => {
    try { setShipments(await apiListShipments()); } catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { refresh(); }, []);

  const setService = (service: string) => {
    setForm((f) => ({ ...f, service, estimatedDelivery: etaForService(service) }));
  };

  const nextFromRoute = () => {
    if (!form.origin.trim() || !form.destination.trim()) {
      toast.error('Pick origin and destination');
      return;
    }
    setForm((f) => ({ ...f, location: f.location || f.origin }));
    setStep(2);
  };

  const save = async () => {
    setBusy(true);
    try {
      await apiSaveShipment({
        number: form.number,
        status: form.status,
        origin: form.origin,
        destination: form.destination,
        service: form.service,
        estimatedDelivery: form.estimatedDelivery,
        location: form.location || form.origin,
      });
      const rank = statusRank(form.status);
      const loc = form.location || form.origin;
      const steps = [
        { min: 0, status: 'Label created', location: form.origin, details: 'Shipping label created' },
        { min: 1, status: 'Picked up', location: form.origin, details: 'We have your package' },
        { min: 2, status: 'In transit', location: loc, details: 'On the way' },
        { min: 3, status: 'Out for delivery', location: form.destination, details: 'Out for delivery' },
        { min: 4, status: 'Delivered', location: form.destination, details: 'Delivered' },
      ];
      for (const ev of steps.filter((s) => rank >= s.min)) {
        try { await apiAddEvent({ number: form.number, status: ev.status, location: ev.location, details: ev.details }); } catch { /* continue */ }
      }
      if (form.setupImage) await apiUploadImage(form.number, form.setupImage, 'setup');
      if (form.deliveredImage && rank >= 4) await apiUploadImage(form.number, form.deliveredImage, 'delivered');
      toast.success(`Tracking ${form.number} is live`);
      setForm({
        number: generateTrackingNumber(),
        origin: '', destination: '', service: 'FedEx Ground', status: 'In transit',
        estimatedDelivery: etaForService('FedEx Ground'), location: '', setupImage: '', deliveredImage: '',
      });
      setStep(1);
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Could not create tracking');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Set up tracking</h1>
        <p className="text-sm text-gray-500">Three steps. Tracking number, dates, and travel history are filled for you.</p>
      </div>

      <div className="flex gap-2 text-sm">
        {['Route', 'Status', 'Photos'].map((label, i) => (
          <button key={label} type="button" onClick={() => setStep(i + 1)} className={`px-3 py-1 rounded-full ${step === i + 1 ? 'bg-[#4D148C] text-white' : 'bg-gray-100'}`}>{i + 1}. {label}</button>
        ))}
      </div>

      {step === 1 && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">TRACKING ID</p>
              <p className="font-mono text-lg">{form.number}</p>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(form.number); toast.success('Copied'); }}><Copy className="h-3.5 w-3.5" /></Button>
              <Button type="button" variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, number: generateTrackingNumber() }))}><RefreshCw className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <PlaceInput label="From" value={form.origin} onChange={(origin) => setForm({ ...form, origin })} />
          <PlaceInput label="To" value={form.destination} onChange={(destination) => setForm({ ...form, destination })} />
          <div>
            <label className="block text-sm font-medium mb-1">Service</label>
            <select className="w-full border rounded h-10 px-2" value={form.service} onChange={(e) => setService(e.target.value)}>
              {FEDEX_SERVICES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Scheduled delivery set to {form.estimatedDelivery}</p>
          </div>
          <Button type="button" className="bg-[#4D148C] text-white" onClick={nextFromRoute}>Continue <ChevronRight className="h-4 w-4 ml-1" /></Button>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Where is it now?</label>
            <select className="w-full border rounded h-10 px-2" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as ShipmentStatus })}>
              {SHIPMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">We will auto-build FROM → current step on the tracking page.</p>
          </div>
          <PlaceInput label="Current city (defaults to origin)" value={form.location} onChange={(location) => setForm({ ...form, location })} />
          <div>
            <label className="block text-sm font-medium mb-1">Scheduled delivery</label>
            <Input value={form.estimatedDelivery} onChange={(e) => setForm({ ...form, estimatedDelivery: e.target.value })} />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" className="bg-[#4D148C] text-white" onClick={() => setStep(3)}>Continue</Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white border rounded-lg p-6 space-y-4">
          <p className="text-sm text-gray-600">Photos are optional. Skip if you have none.</p>
          <div>
            <p className="text-sm font-medium">Package photo</p>
            <input type="file" accept="image/*" onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const r = new FileReader(); r.onload = () => setForm((f) => ({ ...f, setupImage: String(r.result) })); r.readAsDataURL(file);
            }} />
            {form.setupImage && <p className="text-xs text-green-700">Attached</p>}
          </div>
          {statusRank(form.status) >= 4 && (
            <div>
              <p className="text-sm font-medium">Proof of delivery</p>
              <input type="file" accept="image/*" onChange={(e) => {
                const file = e.target.files?.[0]; if (!file) return;
                const r = new FileReader(); r.onload = () => setForm((f) => ({ ...f, deliveredImage: String(r.result) })); r.readAsDataURL(file);
              }} />
            </div>
          )}
          <div className="rounded-md bg-gray-50 p-4 text-sm space-y-1">
            <p className="font-medium flex items-center gap-2"><Check className="h-4 w-4 text-[#4D148C]" /> Ready to publish</p>
            <p>{form.number}</p>
            <p>{form.origin} → {form.destination}</p>
            <p>{form.service} · {form.status} · {form.estimatedDelivery}</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button type="button" disabled={busy} className="bg-[#4D148C] text-white" onClick={save}>{busy ? 'Publishing…' : 'Publish tracking'}</Button>
          </div>
        </div>
      )}

      <div className="bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-3">Live shipments</h2>
        <ul className="divide-y text-sm">
          {shipments.map((s) => (
            <li key={s.number} className="py-3 flex justify-between gap-3">
              <div>
                <p className="font-mono font-medium">{s.number}</p>
                <p className="text-gray-500">{s.status} · {s.origin} → {s.destination}</p>
              </div>
              <Button type="button" variant="outline" onClick={async () => { if (!confirm('Delete?')) return; await apiDeleteShipment(s.number); toast.success('Deleted'); refresh(); }}>Delete</Button>
            </li>
          ))}
          {!shipments.length && <li className="py-6 text-gray-500">None yet — publish one above.</li>}
        </ul>
      </div>
    </div>
  );
}
