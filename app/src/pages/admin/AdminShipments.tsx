import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FEDEX_SERVICES, generateTrackingNumber, geocodePlaces, fetchRoute, type Place } from '@/lib/places';
import { HOLD_REASONS } from '@/lib/holdReasons';
import { PACKAGE_SIZES, formatFee, quoteFee } from '@/lib/shippingRates';
import { apiAddEvent, apiDeleteShipment, apiListShipments, apiSaveShipment, apiUploadImage } from '@/lib/adminApi';
import { Copy, RefreshCw, Sparkles, Truck } from 'lucide-react';

const SCENES = [
  { id: 'label', label: 'Just created', rank: 0 },
  { id: 'picked', label: 'We have it', rank: 1 },
  { id: 'transit', label: 'On the way', rank: 2 },
  { id: 'ofd', label: 'Out for delivery', rank: 3 },
  { id: 'delivered', label: 'Delivered', rank: 4 },
  { id: 'hold', label: 'Stop here', rank: 2 },
];

function hoursAgo(h: number) { return new Date(Date.now() - h * 3600_000); }
function eta(service: string) {
  if (/same|first/i.test(service)) return 'Today · By end of day';
  const days = /overnight/i.test(service) ? 1 : /2day/i.test(service) ? 2 : /saver/i.test(service) ? 3 : 5;
  const d = new Date(); d.setDate(d.getDate() + days);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [service, setService] = useState('FedEx Ground');
  const [sizeId, setSizeId] = useState('medium');
  const [manualFee, setManualFee] = useState('');
  const [scene, setScene] = useState(SCENES[2]);
  const [number, setNumber] = useState(generateTrackingNumber());
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);
  const [route, setRoute] = useState<{ stops: Place[]; miles?: number } | null>(null);
  const [pin, setPin] = useState('');
  const [routing, setRouting] = useState(false);
  const [holdReason, setHoldReason] = useState(HOLD_REASONS[0]);
  const [holdOther, setHoldOther] = useState('');

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
    const out: { status: string; location: string; details: string; hoursAgo: number }[] = [
      { status: 'Label created', location: origin, details: 'Shipping label created', hoursAgo: 40 },
    ];
    if (scene.rank >= 1) out.push({ status: 'Picked up', location: origin, details: 'We have your package', hoursAgo: 32 });
    if (scene.rank >= 2) {
      stops.slice(1, -1).forEach((stop, i) => out.push({ status: 'In transit', location: stop, details: 'On the driving route', hoursAgo: 20 - i * 5 }));
      out.push({
        status: scene.id === 'hold' ? 'Held at location' : 'In transit',
        location: mid,
        details: scene.id === 'hold' ? `Stopped: ${reasonText || 'Held at location'}` : 'On the way',
        hoursAgo: 5,
      });
    }
    if (scene.rank >= 3 && scene.id !== 'hold') out.push({ status: 'Out for delivery', location: destination, details: 'On a local truck', hoursAgo: 2 });
    if (scene.rank >= 4 && scene.id !== 'hold') out.push({ status: 'Delivered', location: destination, details: 'Delivered', hoursAgo: 0.4 });
    return out;
  }, [origin, destination, scene, route, pin, reasonText]);

  const refresh = async () => { try { setShipments(await apiListShipments()); } catch (e: any) { toast.error(e.message); } };
  useEffect(() => { refresh(); }, []);

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
        shippingFee: String(fee), packageSize: sizeLabel,
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
      if (photo) await apiUploadImage(number, photo, scene.rank >= 4 ? 'delivered' : 'setup');
      toast.success(`${number} is live · ${formatFee(fee)}`);
      setNumber(generateTrackingNumber());
      setPhoto('');
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Publish failed');
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Create a tracking story</h1>
          <p className="text-sm text-gray-500">Size sets the rate. Override the fee if you need to.</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-lg">{number}</p>
          <p className="text-sm text-[#4D148C] font-semibold">{formatFee(Number.isFinite(fee) ? fee : 0)}</p>
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
          <label className="block text-xs text-gray-500 mb-1">Manual fee (leave blank to use quote)</label>
          <Input type="number" min="0" step="0.01" value={manualFee} onChange={(e) => setManualFee(e.target.value)} placeholder={String(quoted)} />
        </div>
      </div>
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
          <p className="font-medium text-sm">Why was this stopped?</p>
          <select className="w-full border rounded h-10 px-2 bg-white" value={holdReason} onChange={(e) => setHoldReason(e.target.value)}>
            {HOLD_REASONS.map((r) => <option key={r}>{r}</option>)}
          </select>
          {holdReason === 'Other' && <Input value={holdOther} onChange={(e) => setHoldOther(e.target.value)} placeholder="Type the full reason" />}
        </div>
      )}
      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium"><Sparkles className="h-4 w-4 text-[#4D148C]" /> Preview</div>
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
      <Button disabled={busy} className="bg-[#4D148C] text-white" onClick={publish}><Truck className="h-4 w-4 mr-2" />{busy ? 'Publishing…' : `Make it live · ${formatFee(Number.isFinite(fee) ? fee : 0)}`}</Button>
      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-3">Live now</h2>
        <ul className="divide-y text-sm">
          {shipments.map((s) => (
            <li key={s.number} className="py-3 flex justify-between gap-3">
              <div>
                <p className="font-mono">{s.number}</p>
                <p className="text-gray-500">{s.status}{s.shippingFee != null ? ` · ${formatFee(s.shippingFee)}` : ''}</p>
              </div>
              <Button variant="outline" onClick={async () => { if (!confirm('Delete?')) return; await apiDeleteShipment(s.number); refresh(); }}>Remove</Button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
