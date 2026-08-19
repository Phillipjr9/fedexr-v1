import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FEDEX_SERVICES, generateTrackingNumber, geocodePlaces, fetchRoute, type Place } from '@/lib/places';
import { HOLD_REASONS } from '@/lib/holdReasons';
import { PACKAGE_SIZES, formatFee, quoteFee } from '@/lib/shippingRates';
import { apiAddEvent, apiDeleteShipment, apiListShipments, apiSaveShipment, apiUploadImage, type ImageEventType } from '@/lib/adminApi';
import { Camera, Pencil, Search, Truck, X } from 'lucide-react';

const SCENES = [
  { id: 'label', label: 'Just created', rank: 0 },
  { id: 'picked', label: 'We have it', rank: 1 },
  { id: 'transit', label: 'On the way', rank: 2 },
  { id: 'ofd', label: 'Out for delivery', rank: 3 },
  { id: 'delivered', label: 'Delivered', rank: 4 },
  { id: 'hold', label: 'Stop here', rank: 2 },
];

const STATUS_FILTERS = ['All', 'Label created', 'In transit', 'Out for delivery', 'Delivered', 'Held', 'Exception'];

function eta(service: string) {
  if (/same|first/i.test(service)) return 'Today · By end of day';
  const days = /overnight/i.test(service) ? 1 : /2day/i.test(service) ? 2 : /saver/i.test(service) ? 3 : 5;
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image'));
    reader.readAsDataURL(file);
  });
}

function matchesFilter(status: string, filter: string) {
  if (filter === 'All') return true;
  const s = String(status || '').toLowerCase();
  if (filter === 'Held') return s.includes('hold') || s.includes('held');
  if (filter === 'In transit') return s.includes('transit') || s.includes('way') || s.includes('facility') || s.includes('pick');
  return s.includes(filter.toLowerCase());
}

function PlaceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<Place[]>([]);
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3) { setList([]); return; }
    const t = setTimeout(async () => { try { setList(await geocodePlaces(q)); } catch { setList([]); } }, 280);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="relative">
      <Input value={value} placeholder={placeholder} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} autoComplete="off" />
      {open && list.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border rounded-md shadow max-h-48 overflow-auto text-sm">
          {list.map((s) => (
            <li key={s.display}><button type="button" className="w-full text-left px-3 py-2 hover:bg-purple-50" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(s.display || s.label); setOpen(false); }}>{s.label}</button></li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AdminShipments() {
  const [params, setParams] = useSearchParams();
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [service, setService] = useState('FedEx Ground');
  const [sizeId, setSizeId] = useState('medium');
  const [manualFee, setManualFee] = useState('');
  const [scene, setScene] = useState(SCENES[2]);
  const [number, setNumber] = useState(generateTrackingNumber());
  const [photo, setPhoto] = useState('');
  const [photoKind, setPhotoKind] = useState<ImageEventType>('setup');
  const [busy, setBusy] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [route, setRoute] = useState<{ stops: Place[]; miles?: number } | null>(null);
  const [pin, setPin] = useState('');
  const [routing, setRouting] = useState(false);
  const [holdReason, setHoldReason] = useState(HOLD_REASONS[0]);
  const [holdOther, setHoldOther] = useState('');
  const [editing, setEditing] = useState(false);
  const [editStatus, setEditStatus] = useState('In transit');
  const [editLocation, setEditLocation] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const reasonText = holdReason === 'Other' ? holdOther.trim() : holdReason;
  const quoted = quoteFee(sizeId, service);
  const fee = manualFee.trim() === '' ? quoted : Number(manualFee);

  useEffect(() => {
    if (origin.length < 8 || destination.length < 8) { setRoute(null); return; }
    const t = setTimeout(async () => {
      setRouting(true);
      try {
        const data = await fetchRoute(origin, destination);
        setRoute(data);
        if (data.stops?.length && !pin) setPin(data.stops[Math.floor(data.stops.length / 2)]?.display || data.stops[0]?.label);
      } catch { setRoute(null); }
      finally { setRouting(false); }
    }, 500);
    return () => clearTimeout(t);
  }, [origin, destination]);

  const story = useMemo(() => {
    if (!origin || !destination) return [];
    const stops = (route?.stops || []).map((s) => s.display || s.label);
    const mid = pin || stops[Math.floor(stops.length / 2)] || origin;
    const out: { status: string; location: string; details: string }[] = [
      { status: 'Label created', location: origin, details: 'Shipping label created' },
    ];
    if (scene.rank >= 1) out.push({ status: 'Picked up', location: origin, details: 'We have your package' });
    if (scene.rank >= 2) {
      stops.slice(1, -1).forEach((stop) => out.push({ status: 'In transit', location: stop, details: 'On the driving route' }));
      out.push({
        status: scene.id === 'hold' ? 'Held at location' : 'In transit',
        location: mid,
        details: scene.id === 'hold' ? `Stopped: ${reasonText || 'Held at location'}` : 'On the way',
      });
    }
    if (scene.rank >= 3 && scene.id !== 'hold') out.push({ status: 'Out for delivery', location: destination, details: 'On a local truck' });
    if (scene.rank >= 4 && scene.id !== 'hold') out.push({ status: 'Delivered', location: destination, details: 'Delivered' });
    return out;
  }, [origin, destination, scene, route, pin, reasonText]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return shipments.filter((s) => {
      if (!matchesFilter(s.status, statusFilter)) return false;
      if (!q) return true;
      return [s.number, s.status, s.origin, s.destination, s.location].some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [shipments, query, statusFilter]);

  const refresh = async () => {
    try {
      setShipments(await apiListShipments());
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  useEffect(() => { refresh(); }, []);

  const loadForEdit = (s: any) => {
    setEditing(true);
    setNumber(s.number);
    setOrigin(s.origin || '');
    setDestination(s.destination || '');
    setService(s.service || 'FedEx Ground');
    setEditStatus(s.status || 'In transit');
    setEditLocation(s.location || s.origin || '');
    setEditDetails('');
    setManualFee(s.shippingFee != null ? String(s.shippingFee) : '');
    setPhoto('');
    const st = String(s.status || '').toLowerCase();
    if (st.includes('deliver')) setPhotoKind('delivered');
    else if (st.includes('transit') || st.includes('way') || st.includes('out for')) setPhotoKind('transit');
    else setPhotoKind('setup');
    setParams({ edit: s.number });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    const editNum = params.get('edit');
    if (!editNum || !shipments.length) return;
    const found = shipments.find((s) => String(s.number).toLowerCase() === editNum.toLowerCase());
    if (found && (!editing || number !== found.number)) loadForEdit(found);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, shipments]);

  const resetForm = () => {
    setNumber(generateTrackingNumber());
    setOrigin('');
    setDestination('');
    setPhoto('');
    setPhotoKind('setup');
    setEditing(false);
    setEditStatus('In transit');
    setEditLocation('');
    setEditDetails('');
    setScene(SCENES[2]);
    setManualFee('');
    setParams({});
  };

  const onPickPhoto = async (file?: File | null) => {
    if (!file) return;
    try {
      setPhoto(await fileToDataUrl(file));
    } catch {
      toast.error('Could not read that image');
    }
  };

  const publish = async () => {
    if (!origin || !destination) { toast.error('Choose from and to'); return; }
    if (scene.id === 'hold' && !reasonText) { toast.error('Choose why it was stopped'); return; }
    if (!Number.isFinite(fee) || fee < 0) { toast.error('Enter a valid shipping fee'); return; }
    setBusy(true);
    try {
      const last = story[story.length - 1];
      const sizeLabel = PACKAGE_SIZES.find((s) => s.id === sizeId)?.label || sizeId;
      await apiSaveShipment({
        number, status: last?.status || 'Label created', origin, destination, service,
        estimatedDelivery: eta(service), location: last?.location || origin,
        shippingFee: String(fee), packageSize: sizeLabel, skipEvent: true,
      });
      for (const ev of story) {
        try { await apiAddEvent({ number, status: ev.status, location: ev.location, details: ev.details }); } catch { /* ok */ }
      }
      if (scene.id === 'hold') {
        await fetch('/api/holds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-secret': localStorage.getItem('adminPassword') || '' },
          body: JSON.stringify({ number, location: last?.location || pin, reason: reasonText, email: 'admin@internal' }),
        });
      }
      if (photo) {
        const kind: ImageEventType = scene.rank >= 4 ? 'delivered' : scene.rank >= 2 ? 'transit' : 'setup';
        await apiUploadImage(number, photo, kind);
      }
      toast.success(`${number} is live · ${formatFee(fee)}`);
      resetForm();
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Publish failed');
    } finally { setBusy(false); }
  };

  const saveEdit = async () => {
    if (!number.trim()) { toast.error('Tracking number required'); return; }
    setBusy(true);
    try {
      const sizeLabel = PACKAGE_SIZES.find((s) => s.id === sizeId)?.label || sizeId;
      await apiSaveShipment({
        number,
        status: editStatus || 'In transit',
        origin,
        destination,
        service,
        estimatedDelivery: eta(service),
        location: editLocation || origin,
        shippingFee: String(Number.isFinite(fee) ? fee : 0),
        packageSize: sizeLabel,
        skipEvent: true,
      });
      if (editStatus && editLocation) {
        await apiAddEvent({ number, status: editStatus, location: editLocation, details: editDetails || undefined });
      }
      if (photo) await apiUploadImage(number, photo, photoKind);
      toast.success(`Updated ${number}`);
      resetForm();
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Update failed');
    } finally {
      setBusy(false);
    }
  };

  const uploadOnly = async (s: any, kind: ImageEventType, file: File) => {
    try {
      await apiUploadImage(s.number, await fileToDataUrl(file), kind);
      toast.success(`Photo saved for ${s.number}`);
      refresh();
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{editing ? 'Edit shipment' : 'Create a tracking story'}</h1>
          <p className="text-sm text-gray-500">
            {editing
              ? 'Change status, location, fee, or add a package photo anytime — including while it is on the way.'
              : 'Size sets the rate. Override the fee if you need to.'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg">{number}</p>
          <p className="text-sm text-[#4D148C] font-semibold">{formatFee(Number.isFinite(fee) ? fee : 0)}</p>
          {editing && (
            <Button type="button" variant="outline" className="mt-2 text-gray-900" onClick={resetForm}>
              <X className="h-4 w-4 mr-1" /> Cancel edit
            </Button>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <PlaceInput value={origin} onChange={setOrigin} placeholder="From — street or city" />
        <PlaceInput value={destination} onChange={setDestination} placeholder="To — street or city" />
      </div>

      <select className="border rounded h-10 px-3" value={service} onChange={(e) => setService(e.target.value)}>
        {FEDEX_SERVICES.map((s) => <option key={s}>{s}</option>)}
      </select>

      <div className="grid sm:grid-cols-3 gap-2">
        {PACKAGE_SIZES.map((s) => (
          <button key={s.id} type="button" onClick={() => setSizeId(s.id)} className={`rounded-xl border p-3 text-left ${sizeId === s.id ? 'border-[#4D148C] bg-purple-50' : 'bg-white'}`}>
            <p className="font-semibold text-sm">{s.label}</p>
            <p className="text-xs text-gray-500">{s.hint} · {formatFee(quoteFee(s.id, service))}</p>
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-4 flex flex-wrap items-end gap-4">
        <div>
          <p className="text-xs text-gray-500">Quoted for this size + service</p>
          <p className="text-lg font-semibold">{formatFee(quoted)}</p>
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-gray-500 mb-1">Manual fee</label>
          <Input type="number" min="0" step="0.01" value={manualFee} onChange={(e) => setManualFee(e.target.value)} placeholder={String(quoted)} />
        </div>
      </div>

      {editing ? (
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <p className="font-medium text-sm">Update status / scan</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Status</label>
              <select className="w-full border rounded h-10 px-2" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                {['Label created', 'Picked up', 'In transit', 'At facility', 'Out for delivery', 'Delivered', 'Held at location', 'Exception'].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Current location</label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="City, State" />
            </div>
          </div>
          <Input value={editDetails} onChange={(e) => setEditDetails(e.target.value)} placeholder="Details (optional)" />
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {SCENES.map((s) => (
              <button key={s.id} type="button" onClick={() => setScene(s)} className={`rounded-xl border p-3 text-left text-sm font-semibold ${scene.id === s.id ? 'border-[#4D148C] bg-purple-50' : 'bg-white'}`}>{s.label}</button>
            ))}
          </div>
          <div className="bg-white border rounded-xl p-5">
            <p className="text-sm font-medium mb-2">Route stops {routing ? '(calculating…)' : route?.miles ? `· ${route.miles} mi` : ''}</p>
            <div className="flex flex-wrap gap-2">
              {(route?.stops || []).map((s) => {
                const label = s.display || s.label;
                return (
                  <button key={label} type="button" onClick={() => { setPin(label); setScene(SCENES.find((x) => x.id === 'hold')!); }} className={`text-left text-xs border rounded-lg px-3 py-2 max-w-xs ${pin === label ? 'border-[#4D148C] bg-purple-50' : 'bg-gray-50'}`}>{label}</button>
                );
              })}
            </div>
          </div>
          {scene.id === 'hold' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
              <select className="w-full border rounded h-10 px-2 bg-white" value={holdReason} onChange={(e) => setHoldReason(e.target.value)}>
                {HOLD_REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
              {holdReason === 'Other' && <Input value={holdOther} onChange={(e) => setHoldOther(e.target.value)} placeholder="Type the full reason" />}
            </div>
          )}
          <div className="bg-white border rounded-xl p-5">
            <ol className="space-y-3">
              {story.map((ev, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className={`mt-1 h-2.5 w-2.5 rounded-full ${i === story.length - 1 ? 'bg-[#4D148C]' : 'bg-gray-300'}`} />
                  <div>
                    <p className="font-semibold">{ev.status}</p>
                    <p className="text-gray-600">{ev.location}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <p className="font-medium text-sm flex items-center gap-2"><Camera className="h-4 w-4" /> Package photo</p>
        <div className="flex flex-wrap gap-2">
          {(['setup', 'transit', 'delivered'] as ImageEventType[]).map((k) => (
            <button key={k} type="button" onClick={() => setPhotoKind(k)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${photoKind === k ? 'bg-[#4D148C] text-white border-[#4D148C]' : 'bg-white text-gray-700'}`}>
              {k === 'setup' ? 'Label / pickup' : k === 'transit' ? 'On the way' : 'Delivered'}
            </button>
          ))}
        </div>
        <Input type="file" accept="image/*" onChange={(e) => onPickPhoto(e.target.files?.[0])} />
        {photo && <img src={photo} alt="Preview" className="max-h-40 rounded-lg border" />}
      </div>

      <Button disabled={busy} className="bg-[#4D148C] text-white" onClick={editing ? saveEdit : publish}>
        <Truck className="h-4 w-4 mr-2" />
        {busy ? 'Saving…' : editing ? `Save changes · ${formatFee(Number.isFinite(fee) ? fee : 0)}` : `Make it live · ${formatFee(Number.isFinite(fee) ? fee : 0)}`}
      </Button>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Live now ({filtered.length})</h2>
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input className="pl-8 w-48" placeholder="Search tracking…" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
            <select className="border rounded h-9 px-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_FILTERS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
        </div>
        <ul className="divide-y text-sm">
          {filtered.map((s) => (
            <li key={s.number} className="py-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-mono">{s.number}</p>
                  <p className="text-gray-500">{s.status}{s.shippingFee != null ? ` · ${formatFee(s.shippingFee)}` : ''}</p>
                  <p className="text-xs text-gray-400">{s.origin} → {s.destination}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="text-gray-900 border-gray-300" onClick={() => loadForEdit(s)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button type="button" variant="outline" className="text-red-700 border-red-200" onClick={async () => {
                    if (!confirm('Delete this shipment?')) return;
                    try { await apiDeleteShipment(s.number); refresh(); } catch (e: any) { toast.error(e.message); }
                  }}>
                    Remove
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs text-gray-500">Add photo:</span>
                {(['setup', 'transit', 'delivered'] as ImageEventType[]).map((k) => (
                  <label key={k} className="inline-flex items-center gap-1 text-xs border rounded-lg px-2 py-1.5 cursor-pointer hover:bg-purple-50 text-gray-800">
                    <Camera className="h-3.5 w-3.5" />
                    {k === 'setup' ? 'Label' : k === 'transit' ? 'On the way' : 'Delivered'}
                    <input type="file" accept="image/*" className="sr-only" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) uploadOnly(s, k, f);
                      e.target.value = '';
                    }} />
                  </label>
                ))}
              </div>
            </li>
          ))}
          {!filtered.length && <li className="py-6 text-gray-500">No shipments match this search.</li>}
        </ul>
      </div>
    </div>
  );
}
