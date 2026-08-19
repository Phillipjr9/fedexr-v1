import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { FEDEX_SERVICES, generateTrackingNumber, geocodePlaces, fetchRoute, type Place } from '@/lib/places';
import { PACKAGE_SIZES, formatFee, quoteFee } from '@/lib/shippingRates';
import {
  apiAddEvent,
  apiDeleteShipment,
  apiListShipments,
  apiSaveShipment,
  apiUploadImage,
  apiMarkPaid,
  apiListImages,
  apiDeleteImage,
  MIN_PACKAGE_PHOTOS,
} from '@/lib/adminApi';
import { Pencil, ImageIcon, Trash2 } from 'lucide-react';

async function compressImage(file: File, maxEdge = 1200, quality = 0.72): Promise<Blob> {
  if (!file.type.startsWith('image/')) return file;
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b || file), 'image/jpeg', quality);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read image file'));
    reader.readAsDataURL(blob);
  });
}

type ShipmentRow = {
  number: string;
  status: string;
  origin: string;
  destination: string;
  service?: string;
  serviceId?: string;
  currentLocation?: string;
  estimatedDelivery?: string;
  shippingFee?: number | null;
  packageSize?: string;
  feePaid?: boolean;
  collectPayment?: boolean;
  paymentInstructions?: string;
  paymentRequired?: boolean;
  hasSetupImage?: boolean;
  hasTransitImage?: boolean;
  hasDeliveredImage?: boolean;
};

type GalleryImage = { id: number; eventType: string; dataUrl: string };

const DEFAULT_PAYMENT_INSTRUCTIONS =
  'Pay via Zelle / bank transfer to the account provided by support. Include your tracking number in the memo. After payment, submit your name and email on the tracking page so we can unlock progress.';

const DEFAULT_PACKAGE_ID = PACKAGE_SIZES[0]?.id ?? 'medium';

export default function AdminShipments() {
  const [searchParams] = useSearchParams();
  const [list, setList] = useState<ShipmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('Label created');
  const [editLocation, setEditLocation] = useState('');
  const [editMessage, setEditMessage] = useState('');
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [serviceId, setServiceId] = useState(FEDEX_SERVICES[0]?.id || 'FEDEX_GROUND');
  const [packageSize, setPackageSize] = useState(DEFAULT_PACKAGE_ID);
  const [manualFee, setManualFee] = useState('');
  const [collectPayment, setCollectPayment] = useState(false);
  const [paymentInstructions, setPaymentInstructions] = useState(DEFAULT_PAYMENT_INSTRUCTIONS);
  const [routeStops, setRouteStops] = useState<Place[]>([]);
  const [selectedStops, setSelectedStops] = useState<Record<number, boolean>>({});
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);

  const serviceLabel = FEDEX_SERVICES.find((s) => s.id === serviceId)?.label || serviceId;
  const quoted = useMemo(() => quoteFee(packageSize, serviceLabel), [packageSize, serviceLabel]);
  const feeNum = manualFee.trim() ? Number(manualFee) : quoted;
  const photoCount = gallery.length;
  const photosOk = photoCount >= MIN_PACKAGE_PHOTOS;

  async function refresh() {
    setLoading(true);
    try {
      const rows = await apiListShipments();
      setList(rows as ShipmentRow[]);
    } catch (e: any) {
      toast.error(e.message || 'Could not load shipments');
    } finally {
      setLoading(false);
    }
  }

  async function refreshGallery(number: string) {
    setGalleryLoading(true);
    try {
      const { images } = await apiListImages(number);
      setGallery(images);
    } catch {
      setGallery([]);
    } finally {
      setGalleryLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    const n = searchParams.get('number') || searchParams.get('edit');
    if (n && list.length) {
      const s = list.find((x) => x.number === n);
      if (s) loadForEdit(s);
    }
  }, [searchParams, list]);

  function loadForEdit(s: ShipmentRow) {
    setEditing(s.number);
    setEditStatus(s.status || 'Label created');
    setEditLocation(s.currentLocation || '');
    setOrigin(s.origin || '');
    setDestination(s.destination || '');
    setServiceId(s.serviceId || FEDEX_SERVICES[0]?.id || 'FEDEX_GROUND');
    const sizeId =
      PACKAGE_SIZES.find((p) => p.id === s.packageSize || p.label === s.packageSize)?.id ||
      DEFAULT_PACKAGE_ID;
    setPackageSize(sizeId);
    setManualFee(s.shippingFee != null ? String(s.shippingFee) : '');
    setCollectPayment(!!s.collectPayment);
    if (s.paymentInstructions) setPaymentInstructions(s.paymentInstructions);
    setEditMessage('');
    setGallery([]);
    refreshGallery(s.number);
  }

  async function loadRouteStops() {
    if (!origin.trim() || !destination.trim()) {
      toast.error('Set From and To first');
      return;
    }
    setLoadingRoute(true);
    try {
      const places = await geocodePlaces([origin.trim(), destination.trim()]);
      if (places.length < 2) throw new Error('Could not geocode From/To');
      const route = await fetchRoute(places[0], places[1]);
      setRouteStops(route.stops || []);
      const sel: Record<number, boolean> = {};
      (route.stops || []).forEach((_, i) => {
        sel[i] = i === 0 || i === (route.stops!.length - 1);
      });
      setSelectedStops(sel);
      toast.success(`Loaded ${(route.stops || []).length} stops along route`);
    } catch (e: any) {
      toast.error(e.message || 'Route failed');
    } finally {
      setLoadingRoute(false);
    }
  }

  async function createShipment() {
    if (!origin.trim() || !destination.trim()) {
      toast.error('From and To required');
      return;
    }
    setSaving(true);
    try {
      const number = generateTrackingNumber();
      const service = FEDEX_SERVICES.find((s) => s.id === serviceId)?.label || serviceId;
      await apiSaveShipment({
        number,
        status: 'Label created',
        origin: origin.trim(),
        destination: destination.trim(),
        service,
        serviceId,
        location: origin.trim(),
        currentLocation: origin.trim(),
        estimatedDelivery: '',
        estimatedDeliveryText: '',
        shippingFee: Number.isFinite(feeNum) ? feeNum : quoted,
        packageSize,
        collectPayment: collectPayment ? 'true' : 'false',
        paymentInstructions: collectPayment ? paymentInstructions : '',
      } as any);
      const chosen = routeStops.filter((_, i) => selectedStops[i]);
      for (const stop of chosen.slice(1, -1)) {
        await apiAddEvent({
          number,
          status: 'In transit',
          location: stop.name || stop.label || '',
          details: 'Departed facility',
        });
      }
      toast.success(`Created ${number} — upload at least ${MIN_PACKAGE_PHOTOS} package photos below`);
      setEditing(number);
      setGallery([]);
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    if (!photosOk) {
      toast.error(`Upload at least ${MIN_PACKAGE_PHOTOS} package photos (${photoCount}/${MIN_PACKAGE_PHOTOS})`);
      return;
    }
    setSaving(true);
    try {
      const service = FEDEX_SERVICES.find((s) => s.id === serviceId)?.label || serviceId;
      await apiSaveShipment({
        number: editing,
        status: editStatus,
        origin: origin.trim(),
        destination: destination.trim(),
        service,
        serviceId,
        location: editLocation.trim() || origin.trim(),
        currentLocation: editLocation.trim() || origin.trim(),
        estimatedDelivery: '',
        estimatedDeliveryText: '',
        shippingFee: Number.isFinite(feeNum) ? feeNum : quoted,
        packageSize,
        collectPayment: collectPayment ? 'true' : 'false',
        paymentInstructions: collectPayment ? paymentInstructions : '',
      } as any);
      if (editMessage.trim() || editStatus) {
        await apiAddEvent({
          number: editing,
          status: editStatus,
          location: editLocation.trim() || origin.trim(),
          details: editMessage.trim() || editStatus,
        });
      }
      toast.success('Saved');
      await refresh();
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function onUploadMany(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length || !editing) {
      if (!editing) toast.error('Open a shipment with Edit first, then upload');
      return;
    }
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) {
      toast.error('Please choose image files');
      e.target.value = '';
      return;
    }
    setUploading(true);
    let ok = 0;
    let lastCount = photoCount;
    try {
      for (const file of imageFiles) {
        try {
          const blob = await compressImage(file);
          const dataUrl = await blobToDataUrl(blob);
          if (!dataUrl.startsWith('data:')) continue;
          const res = await apiUploadImage(editing, dataUrl, 'setup');
          ok += 1;
          lastCount = res.count ?? lastCount + 1;
        } catch (err: any) {
          toast.error(err.message || `Failed: ${file.name}`);
        }
      }
      await refreshGallery(editing);
      if (ok) {
        const meets = lastCount >= MIN_PACKAGE_PHOTOS;
        toast.success(
          meets
            ? `Uploaded ${ok} photo(s). Total ${lastCount} — minimum met.`
            : `Uploaded ${ok} photo(s). ${lastCount}/${MIN_PACKAGE_PHOTOS} — add ${MIN_PACKAGE_PHOTOS - lastCount} more.`
        );
      }
      await refresh();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function removePhoto(id: number) {
    if (!editing) return;
    try {
      await apiDeleteImage(id);
      await refreshGallery(editing);
      toast.success('Photo removed');
    } catch (e: any) {
      toast.error(e.message || 'Could not delete');
    }
  }

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return list;
    return list.filter(
      (s) =>
        s.number.toLowerCase().includes(qq) ||
        (s.origin || '').toLowerCase().includes(qq) ||
        (s.destination || '').toLowerCase().includes(qq)
    );
  }, [list, q]);

  const editingRow = editing ? list.find((s) => s.number === editing) : null;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Shipments</h1>
        <p className="text-sm text-gray-500">
          Create labels, set fees, and upload at least {MIN_PACKAGE_PHOTOS} package photos (before or after payment).
        </p>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <p className="font-medium text-sm">New shipment / fee settings</p>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">From</label>
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="City, ST" />
          </div>
          <div>
            <label className="text-xs text-gray-500">To</label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="City, ST" />
          </div>
          <div>
            <label className="text-xs text-gray-500">Service</label>
            <select className="w-full border rounded h-10 px-2" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
              {FEDEX_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Package size</label>
            <select className="w-full border rounded h-10 px-2" value={packageSize} onChange={(e) => setPackageSize(e.target.value)}>
              {PACKAGE_SIZES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <p className="text-xs text-gray-500">Quoted for this size + service</p>
            <p className="text-lg font-semibold">{formatFee(quoted)}</p>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs text-gray-500 mb-1">Manual fee</label>
            <Input type="number" min="0" step="0.01" value={manualFee} onChange={(e) => setManualFee(e.target.value)} placeholder={String(quoted)} />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm cursor-pointer">
          <input type="checkbox" className="mt-1" checked={collectPayment} onChange={(e) => setCollectPayment(e.target.checked)} />
          <span>
            <span className="font-semibold">Require payment before tracking advances</span>
            <span className="block text-xs text-gray-500">Only this shipment shows the payment box. Leave off for normal tracking.</span>
          </span>
        </label>
        {collectPayment && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Offline payment instructions (shown to customer)</label>
            <textarea className="w-full border rounded-md p-2 text-sm min-h-[88px]" value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} placeholder="Bank / Zelle details..." />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={loadRouteStops} disabled={loadingRoute} variant="outline">{loadingRoute ? 'Loading route…' : 'Load route stops'}</Button>
          <Button type="button" onClick={createShipment} disabled={saving} className="bg-[#FF6200] hover:bg-[#e55a00] text-white">{saving ? 'Saving…' : 'Create label'}</Button>
        </div>
        {routeStops.length > 0 && (
          <div className="border rounded-lg p-3 max-h-48 overflow-auto text-sm space-y-1">
            <p className="text-xs text-gray-500 mb-2">Choose stops that appear in tracking story</p>
            {routeStops.map((stop, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!selectedStops[i]} onChange={(e) => setSelectedStops((prev) => ({ ...prev, [i]: e.target.checked }))} />
                <span className="font-mono text-xs text-gray-400">{i + 1}</span>
                <span>{stop.name || stop.label || `${stop.lat}, ${stop.lon}`}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <p className="font-medium text-sm">
            Update status / photos — <span className="font-mono">{editing}</span>
            {editingRow?.collectPayment && (
              <span className="ml-2 text-xs font-normal text-gray-500">
                {editingRow.feePaid ? '(payment received)' : '(payment still due — photos still allowed)'}
              </span>
            )}
          </p>
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
              <label className="text-xs text-gray-500">Location</label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="City, ST" />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500">Scan / note</label>
            <Input value={editMessage} onChange={(e) => setEditMessage(e.target.value)} placeholder="Optional detail for timeline" />
          </div>
          <Button type="button" onClick={saveEdit} disabled={saving} className="bg-[#FF6200] hover:bg-[#e55a00] text-white">
            {saving ? 'Saving…' : 'Save update'}
          </Button>

          <div className="border-t pt-4 space-y-3">
            <div className="flex items-start gap-2">
              <ImageIcon className="h-5 w-5 text-[#4D148C] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">Package photos (required)</p>
                <p className="text-xs text-gray-500">
                  Upload at least {MIN_PACKAGE_PHOTOS} photos. You can add more anytime — before or after payment.
                </p>
                <p className={`mt-1 text-sm font-semibold ${photosOk ? 'text-green-700' : 'text-amber-700'}`}>
                  {photoCount}/{MIN_PACKAGE_PHOTOS} minimum{photosOk ? ' · Ready' : ` · ${Math.max(0, MIN_PACKAGE_PHOTOS - photoCount)} more needed`}
                </p>
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 h-10 cursor-pointer hover:bg-gray-50 bg-white">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={onUploadMany}
                disabled={uploading}
              />
              {uploading ? 'Uploading…' : 'Choose photos (select multiple)'}
            </label>

            {galleryLoading && <p className="text-xs text-gray-400">Loading photos…</p>}

            {gallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((img, idx) => (
                  <div key={img.id} className="relative group border rounded-lg overflow-hidden bg-gray-50">
                    <img src={img.dataUrl} alt={`Package ${idx + 1}`} className="w-full h-28 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 flex justify-between items-center">
                      <span>#{idx + 1}</span>
                      <button
                        type="button"
                        className="p-0.5 hover:text-red-300"
                        title="Remove"
                        onClick={() => removePhoto(img.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!galleryLoading && gallery.length === 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                No photos yet. Select multiple images (5 or more) to meet the requirement.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
          <p className="font-medium text-sm">All shipments</p>
          <Input className="max-w-xs" placeholder="Search tracking / city" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        <ul className="divide-y text-sm">
          {filtered.map((s) => (
            <li key={s.number} className="py-4 space-y-3">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="font-mono">{s.number}</p>
                  <p className="text-gray-500">
                    {s.status}
                    {s.shippingFee != null ? ` · ${formatFee(s.shippingFee)}` : ''}
                    {s.collectPayment ? (s.feePaid ? ' · Paid' : ' · Payment due') : ''}
                    {(s.hasSetupImage || s.hasTransitImage || s.hasDeliveredImage) ? ' · Has photo' : ''}
                  </p>
                  <p className="text-xs text-gray-400">{s.origin} → {s.destination}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="text-gray-900 border-gray-300" onClick={() => loadForEdit(s)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  {s.collectPayment && !s.feePaid && (
                    <Button type="button" variant="outline" className="text-green-800 border-green-300" onClick={async () => {
                      try { await apiMarkPaid(s.number); toast.success(`Marked paid: ${s.number}`); refresh(); }
                      catch (e: any) { toast.error(e.message || 'Could not mark paid'); }
                    }}>Mark paid</Button>
                  )}
                  <Button type="button" variant="outline" className="text-red-700 border-red-200" onClick={async () => {
                    if (!confirm('Delete this shipment?')) return;
                    try { await apiDeleteShipment(s.number); refresh(); } catch (e: any) { toast.error(e.message); }
                  }}>Remove</Button>
                </div>
              </div>
            </li>
          ))}
          {!loading && filtered.length === 0 && <li className="py-6 text-gray-500 text-center">No shipments match this search.</li>}
        </ul>
      </div>
    </div>
  );
}
