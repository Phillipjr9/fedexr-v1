import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FEDEX_SERVICES, generateTrackingNumber, geocodePlaces } from '@/lib/places';
import { apiAddEvent, apiDeleteShipment, apiListShipments, apiSaveShipment, apiUploadImage } from '@/lib/adminApi';
import { Copy, RefreshCw, Sparkles, Truck } from 'lucide-react';

const HUBS = [
  'Memphis, TN US',
  'Indianapolis, IN US',
  'Newark, NJ US',
  'Chicago, IL US',
  'Dallas, TX US',
  'Atlanta, GA US',
  'Oakland, CA US',
  'Los Angeles, CA US',
];

const SCENES = [
  { id: 'label', label: 'Just created', rank: 0, hint: 'Label only — nothing scanned yet' },
  { id: 'picked', label: 'We have it', rank: 1, hint: 'Picked up at origin' },
  { id: 'transit', label: 'On the way', rank: 2, hint: 'Moving through hubs' },
  { id: 'ofd', label: 'Out for delivery', rank: 3, hint: 'On a truck today' },
  { id: 'delivered', label: 'Delivered', rank: 4, hint: 'Show as delivered' },
];

function hoursAgo(h: number) {
  const d = new Date(Date.now() - h * 3600_000);
  return d;
}

function eta(service: string) {
  const days = /overnight|same|first/i.test(service) ? 1 : /2day/i.test(service) ? 2 : /saver/i.test(service) ? 3 : 5;
  const d = new Date();
  d.setDate(d.getDate() + (days === 1 && /same|first/i.test(service) ? 0 : days));
  if (/same|first/i.test(service)) return 'Today · By end of day';
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function hubsBetween(origin: string, dest: string) {
  const skip = (s: string) => origin.toLowerCase().includes(s.split(',')[0].toLowerCase()) || dest.toLowerCase().includes(s.split(',')[0].toLowerCase());
  return HUBS.filter((h) => !skip(h)).slice(0, 2);
}

function buildStory(origin: string, dest: string, rank: number) {
  const hops = hubsBetween(origin, dest);
  const story: { status: string; location: string; details: string; hoursAgo: number }[] = [
    { status: 'Label created', location: origin, details: 'Shipping label created', hoursAgo: 36 },
  ];
  if (rank >= 1) story.push({ status: 'Picked up', location: origin, details: 'We have your package', hoursAgo: 30 });
  if (rank >= 2) {
    hops.forEach((hub, i) => {
      story.push({ status: i === 0 ? 'Arrived at facility' : 'In transit', location: hub, details: 'On the way', hoursAgo: 18 - i * 6 });
    });
    story.push({ status: 'In transit', location: hops[0] || origin, details: 'On the way', hoursAgo: 6 });
  }
  if (rank >= 3) story.push({ status: 'Out for delivery', location: dest, details: 'On a local truck', hoursAgo: 2 });
  if (rank >= 4) story.push({ status: 'Delivered', location: dest, details: 'Delivered', hoursAgo: 0.5 });
  return story;
}

function PlaceInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    const q = value.trim();
    if (q.length < 2) { setList([]); return; }
    const t = setTimeout(async () => {
      try { setList(await geocodePlaces(q)); } catch { setList([]); }
    }, 250);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div className="relative">
      <Input value={value} placeholder={placeholder} onChange={(e) => { onChange(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 120)} autoComplete="off" />
      {open && list.length > 0 && (
        <ul className="absolute z-20 w-full bg-white border rounded-md shadow max-h-40 overflow-auto text-sm">
          {list.map((s) => (
            <li key={s}><button type="button" className="w-full text-left px-3 py-2 hover:bg-purple-50" onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(s); setOpen(false); }}>{s}</button></li>
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
  const [scene, setScene] = useState(SCENES[2]);
  const [number, setNumber] = useState(generateTrackingNumber());
  const [photo, setPhoto] = useState('');
  const [busy, setBusy] = useState(false);
  const [shipments, setShipments] = useState<any[]>([]);

  const story = useMemo(() => {
    if (!origin || !destination) return [];
    return buildStory(origin, destination, scene.rank);
  }, [origin, destination, scene]);

  const refresh = async () => {
    try { setShipments(await apiListShipments()); } catch (e: any) { toast.error(e.message); }
  };
  useEffect(() => { refresh(); }, []);

  const publish = async () => {
    if (!origin || !destination) { toast.error('Choose from and to'); return; }
    setBusy(true);
    try {
      const status = story[story.length - 1]?.status || 'Label created';
      const location = story[story.length - 1]?.location || origin;
      await apiSaveShipment({
        number,
        status,
        origin,
        destination,
        service,
        estimatedDelivery: eta(service),
        location,
      });
      for (const ev of story) {
        try { await apiAddEvent({ number, status: ev.status, location: ev.location, details: ev.details }); } catch { /* ok */ }
      }
      if (photo) await apiUploadImage(number, photo, scene.rank >= 4 ? 'delivered' : 'setup');
      toast.success(`${number} is live`);
      setNumber(generateTrackingNumber());
      setPhoto('');
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Publish failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#4D148C]">Stage a package</p>
          <h1 className="text-2xl font-semibold">Create a tracking story</h1>
          <p className="text-sm text-gray-500">Pick two cities and how far along it is. Hubs and times write themselves.</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">TRACKING ID</p>
          <p className="font-mono text-lg">{number}</p>
          <div className="flex justify-end gap-1 mt-1">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(number); toast.success('Copied'); }}><Copy className="h-3.5 w-3.5" /></Button>
            <Button size="sm" variant="outline" onClick={() => setNumber(generateTrackingNumber())}><RefreshCw className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <PlaceInput value={origin} onChange={setOrigin} placeholder="From — start typing a city" />
        <PlaceInput value={destination} onChange={setDestination} placeholder="To — start typing a city" />
      </div>

      <select className="border rounded h-10 px-3" value={service} onChange={(e) => setService(e.target.value)}>
        {FEDEX_SERVICES.map((s) => <option key={s}>{s}</option>)}
      </select>

      <div className="grid sm:grid-cols-5 gap-2">
        {SCENES.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setScene(s)}
            className={`rounded-xl border p-3 text-left ${scene.id === s.id ? 'border-[#4D148C] bg-purple-50' : 'bg-white hover:border-gray-300'}`}
          >
            <p className="font-semibold text-sm">{s.label}</p>
            <p className="text-xs text-gray-500 mt-1">{s.hint}</p>
          </button>
        ))}
      </div>

      <div className="bg-white border rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium">
          <Sparkles className="h-4 w-4 text-[#4D148C]" />
          Preview of what the customer will see
        </div>
        {!story.length && <p className="text-sm text-gray-400">Choose from and to to preview the journey.</p>}
        <ol className="space-y-3">
          {story.map((ev, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <span className={`mt-1 h-2.5 w-2.5 rounded-full ${i === story.length - 1 ? 'bg-[#4D148C]' : 'bg-gray-300'}`} />
              <div>
                <p className="font-semibold">{ev.status}</p>
                <p className="text-gray-600">{ev.location}</p>
                <p className="text-xs text-gray-400">{hoursAgo(ev.hoursAgo).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ol>
        {origin && destination && (
          <p className="text-xs text-gray-500 mt-4">Scheduled delivery: {eta(service)}</p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <label className="text-sm text-gray-600">
          Optional photo
          <input className="block mt-1" type="file" accept="image/*" onChange={(e) => {
            const f = e.target.files?.[0]; if (!f) return;
            const r = new FileReader();
            r.onload = () => setPhoto(String(r.result));
            r.readAsDataURL(f);
          }} />
        </label>
        <Button disabled={busy} className="bg-[#4D148C] text-white ml-auto" onClick={publish}>
          <Truck className="h-4 w-4 mr-2" />
          {busy ? 'Publishing…' : 'Make it live'}
        </Button>
      </div>

      <div className="bg-white border rounded-xl p-5">
        <h2 className="font-semibold mb-3">Live now</h2>
        <ul className="divide-y text-sm">
          {shipments.map((s) => (
            <li key={s.number} className="py-3 flex justify-between gap-3">
              <div>
                <p className="font-mono">{s.number}</p>
                <p className="text-gray-500">{s.status} · {s.origin} → {s.destination}</p>
              </div>
              <Button variant="outline" onClick={async () => { if (!confirm('Delete?')) return; await apiDeleteShipment(s.number); refresh(); }}>Remove</Button>
            </li>
          ))}
          {!shipments.length && <li className="py-4 text-gray-400">Nothing live yet.</li>}
        </ul>
      </div>
    </div>
  );
}
