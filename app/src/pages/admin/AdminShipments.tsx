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
} from '@/lib/adminApi';
import { ImageLightbox } from '@/components/ImageLightbox';
import { Pencil, ImageIcon, Trash2 } from 'lucide-react';
import {
  compressImage,
  blobToDataUrl,
  WINDOWS,
  formatDeliveryLabel,
  parseDeliveryFields,
  DEFAULT_PAY,
  DEFAULT_PACKAGE_ID,
  type GalleryImage,
} from './adminShipmentHelpers';

export default function AdminShipments() {
  const [searchParams] = useSearchParams();
  const [list, setList] = useState<any[]>([]);
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
  const [paymentInstructions, setPaymentInstructions] = useState(DEFAULT_PAY);
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryWindow, setDeliveryWindow] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [notifyEmail, setNotifyEmail] = useState('');
  const [routeStops, setRouteStops] = useState<Place[]>([]);
  const [selectedStops, setSelectedStops] = useState<Record<number, boolean>>({});
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);

  const serviceLabel = FEDEX_SERVICES.find((s) => s.id === serviceId)?.label || serviceId;
  const quoted = useMemo(() => quoteFee(packageSize, serviceLabel), [packageSize, serviceLabel]);
  const feeNum = manualFee.trim() ? Number(manualFee) : quoted;
  const photoCount = gallery.length;
  const previewUrls = useMemo(() => gallery.map((g) => g.dataUrl), [gallery]);
  const deliveryPreview = useMemo(
    () => formatDeliveryLabel(deliveryDate, deliveryWindow, deliveryTime),
    [deliveryDate, deliveryWindow, deliveryTime]
  );

  async function refresh() {
    setLoading(true);
    try {
      setList(await apiListShipments());
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

  function loadForEdit(s: any) {
    setEditing(s.number);
    setEditStatus(s.status || 'Label created');
    setEditLocation(s.currentLocation || s.location || '');
    setOrigin(s.origin || '');
    setDestination(s.destination || '');
    const matchedService =
      FEDEX_SERVICES.find((x) => x.id === s.serviceId)?.id ||
      FEDEX_SERVICES.find((x) => x.id === s.service)?.id ||
      FEDEX_SERVICES.find((x) => x.label === s.service)?.id ||
      FEDEX_SERVICES[0]?.id ||
      'FEDEX_GROUND';
    setServiceId(matchedService);
    const sizeId =
      PACKAGE_SIZES.find((p) => p.id === s.packageSize || p.label === s.packageSize)?.id || DEFAULT_PACKAGE_ID;
    setPackageSize(sizeId);
    setManualFee(s.shippingFee != null ? String(s.shippingFee) : '');
    setCollectPayment(!!s.collectPayment);
    if (s.paymentInstructions) setPaymentInstructions(s.paymentInstructions);
    const parsed = parseDeliveryFields(s.estimatedDelivery);
    setDeliveryDate(parsed.date);
    setDeliveryWindow(parsed.windowId);
    setDeliveryTime(parsed.exactTime);
    setNotifyEmail(s.notifyEmail || '');
    setEditMessage('');
    setGallery([]);
    setPreviewIndex(null);
    setRouteStops([]);
    setSelectedStops({});
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
      (route.stops || []).forEach((_: any, i: number) => {
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

  function deliveryPayload() {
    const label = formatDeliveryLabel(deliveryDate, deliveryWindow, deliveryTime);
    return { estimatedDelivery: label, estimatedDeliveryText: label };
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
      const del = deliveryPayload();
      await apiSaveShipment({
        number,
        status: 'Label created',
        origin: origin.trim(),
        destination: destination.trim(),
        service,
        serviceId,
        location: origin.trim(),
        currentLocation: origin.trim(),
        ...del,
        notifyEmail: notifyEmail.trim(),
        notifyEnabled: !!notifyEmail.trim(),
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
          location: stop.name || stop.label || stop.short || stop.city || '',
          details: 'Departed facility',
        });
      }
      toast.success(del.estimatedDelivery ? `Created ${number} · ${del.estimatedDelivery}` : `Created ${number}`);
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
    setSaving(true);
    try {
      const service = FEDEX_SERVICES.find((s) => s.id === serviceId)?.label || serviceId;
      const del = deliveryPayload();
      const loc = editLocation.trim() || origin.trim();
      await apiSaveShipment({
        number: editing,
        status: editStatus,
        origin: origin.trim(),
        destination: destination.trim(),
        service,
        serviceId,
        location: loc,
        currentLocation: loc,
        ...del,
        notifyEmail: notifyEmail.trim(),
        notifyEnabled: !!notifyEmail.trim(),
        shippingFee: Number.isFinite(feeNum) ? feeNum : quoted,
        packageSize,
        collectPayment: collectPayment ? 'true' : 'false',
        paymentInstructions: collectPayment ? paymentInstructions : '',
        skipEvent: true,
      } as any);
      await apiAddEvent({
        number: editing,
        status: editStatus,
        location: loc,
        details: editMessage.trim() || editStatus,
      });
      const chosen = routeStops.filter((_, i) => selectedStops[i]);
      if (chosen.length > 2) {
        try {
          await fetch(`/api/admin/events?number=${encodeURIComponent(editing)}&clearRoute=1`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-admin-secret': localStorage.getItem('adminPassword') || '',
            },
          });
        } catch { /* ok */ }
        for (const stop of chosen.slice(1, -1)) {
          const stopLoc = stop.name || stop.label || stop.short || stop.city || stop.display || '';
          if (!stopLoc.trim()) continue;
          await apiAddEvent({
            number: editing,
            status: 'In transit',
            location: stopLoc.trim(),
            details: 'Departed facility',
          });
        }
        toast.success(
          del.estimatedDelivery
            ? `Saved · ${del.estimatedDelivery} · ${chosen.length - 2} stop(s) updated`
            : `Saved · ${chosen.length - 2} route stop(s) updated`
        );
      } else {
        toast.success(del.estimatedDelivery ? `Saved · ${del.estimatedDelivery}` : 'Saved');
      }
      setRouteStops([]);
      setSelectedStops({});
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
      if (ok) toast.success(`Uploaded ${ok} photo(s). Total: ${lastCount}.`);
      await refresh();
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function removePhoto(id: number, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!editing) return;
    try {
      await apiDeleteImage(id);
      await refreshGallery(editing);
      setPreviewIndex(null);
      toast.success('Photo removed');
    } catch (err: any) {
      toast.error(err.message || 'Could not delete');
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
          Create labels, delivery windows, fees, photos, and status updates.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <p className="font-medium text-sm">{editing ? `Editing ${editing} — route, fee & delivery` : 'New shipment / fee settings'}</p>
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

        <div className="space-y-3 rounded-lg border border-gray-100 bg-gray-50/80 p-3">
          <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Scheduled delivery</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Date</label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} className="mt-0.5 bg-white" />
            </div>
            <div>
              <label className="text-xs text-gray-500">Delivery window</label>
              <select className="mt-0.5 w-full border rounded-md h-10 px-2 text-sm bg-white" value={deliveryWindow} onChange={(e) => setDeliveryWindow(e.target.value)}>
                {WINDOWS.map((w) => (
                  <option key={w.id || 'none'} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>
          {deliveryWindow === 'exact' && (
            <div className="max-w-xs">
              <label className="text-xs text-gray-500">Exact time</label>
              <Input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="mt-0.5 bg-white" />
            </div>
          )}
          {deliveryPreview && (
            <p className="text-xs text-gray-600">
              Customer will see: <span className="font-medium text-gray-900">{deliveryPreview}</span>
            </p>
          )}
          <div>
            <label className="text-xs text-gray-500">Status notification email (optional)</label>
            <Input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="customer@email.com" className="mt-0.5 bg-white" />
            <p className="text-[11px] text-gray-400 mt-1">Emails on status update when RESEND_API_KEY is set.</p>
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
            <span className="block text-xs text-gray-500">Only this shipment shows the payment box.</span>
          </span>
        </label>
        {collectPayment && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Offline payment instructions (shown to customer)</label>
            <textarea className="w-full border rounded-md p-2 text-sm min-h-[88px]" value={paymentInstructions} onChange={(e) => setPaymentInstructions(e.target.value)} placeholder="Bank / Zelle details..." />
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={loadRouteStops} disabled={loadingRoute} variant="outline">
            {loadingRoute ? 'Loading route…' : editing ? 'Reload route stops' : 'Load route stops'}
          </Button>
          {!editing && (
            <Button type="button" onClick={createShipment} disabled={saving} className="bg-[#FF6200] hover:bg-[#e55a00] text-white">
              {saving ? 'Saving…' : 'Create label'}
            </Button>
          )}
          {editing && routeStops.length > 0 && (
            <p className="text-xs text-gray-500 self-center">
              Selected intermediate stops will be added when you click Save update below.
            </p>
          )}
        </div>

        {routeStops.length > 0 && (
          <div className="border rounded-lg p-3 max-h-48 overflow-auto text-sm space-y-1">
            <p className="text-xs text-gray-500 mb-2">
              {editing
                ? 'Choose stops to add to the tracking timeline (Save update applies them)'
                : 'Choose stops that appear in tracking story'}
            </p>
            {routeStops.map((stop, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!selectedStops[i]} onChange={(e) => setSelectedStops((prev) => ({ ...prev, [i]: e.target.checked }))} />
                <span className="font-mono text-xs text-gray-400">{i + 1}</span>
                <span>{stop.name || stop.label || stop.short || stop.city || `${stop.lat}, ${stop.lon}`}</span>
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
                {editingRow.feePaid ? '(payment received)' : '(payment still due)'}
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
              <label className="text-xs text-gray-500">Current location (shown on tracking)</label>
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="City, ST" />
              <p className="text-[11px] text-gray-400 mt-1">This updates the package&apos;s current position customers see on tracking.</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Delivery date</label>
              <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Delivery window</label>
              <select className="w-full border rounded h-10 px-2" value={deliveryWindow} onChange={(e) => setDeliveryWindow(e.target.value)}>
                {WINDOWS.map((w) => (
                  <option key={w.id || 'none'} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>
          {deliveryWindow === 'exact' && (
            <Input type="time" value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} />
          )}
          <div>
            <label className="text-xs text-gray-500">Notify email</label>
            <Input type="email" value={notifyEmail} onChange={(e) => setNotifyEmail(e.target.value)} placeholder="customer@email.com" />
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
                <p className="font-medium text-sm text-gray-900">Package photos (optional)</p>
                <p className="text-xs text-gray-500">Upload one or many. Click a thumbnail to preview.</p>
                {photoCount > 0 && (
                  <p className="mt-1 text-sm font-medium text-gray-700">{photoCount} photo{photoCount === 1 ? '' : 's'}</p>
                )}
              </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 h-10 cursor-pointer hover:bg-gray-50 bg-white">
              <input type="file" accept="image/*" multiple className="hidden" onChange={onUploadMany} disabled={uploading} />
              {uploading ? 'Uploading…' : 'Choose photo(s)'}
            </label>
            {galleryLoading && <p className="text-xs text-gray-400">Loading photos…</p>}
            {gallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative border rounded-lg overflow-hidden bg-gray-50 cursor-pointer"
                    onClick={() => setPreviewIndex(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') setPreviewIndex(idx);
                    }}
                  >
                    <img src={img.dataUrl} alt={`Package ${idx + 1}`} className="w-full h-28 object-cover" />
                    <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[10px] px-1.5 py-0.5 flex justify-between items-center">
                      <span>#{idx + 1} · Preview</span>
                      <button type="button" className="p-0.5 hover:text-red-300" title="Remove" onClick={(e) => removePhoto(img.id, e)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {!galleryLoading && gallery.length === 0 && (
              <p className="text-xs text-gray-500">No photos yet. You can add one or more anytime.</p>
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
                  {s.estimatedDelivery && (
                    <p className="text-xs text-[#4D148C] mt-0.5">Delivery: {s.estimatedDelivery}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="text-gray-900 border-gray-300" onClick={() => loadForEdit(s)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  {s.collectPayment && !s.feePaid && (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-green-800 border-green-300"
                      onClick={async () => {
                        try {
                          await apiMarkPaid(s.number);
                          toast.success(`Marked paid: ${s.number}`);
                          refresh();
                        } catch (e: any) {
                          toast.error(e.message || 'Could not mark paid');
                        }
                      }}
                    >
                      Mark paid
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="text-red-700 border-red-200"
                    onClick={async () => {
                      if (!confirm('Delete this shipment?')) return;
                      try {
                        await apiDeleteShipment(s.number);
                        refresh();
                      } catch (e: any) {
                        toast.error(e.message);
                      }
                    }}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </li>
          ))}
          {!loading && filtered.length === 0 && (
            <li className="py-6 text-gray-500 text-center">No shipments match this search.</li>
          )}
        </ul>
      </div>

      {previewIndex != null && previewUrls[previewIndex] && (
        <ImageLightbox
          images={previewUrls}
          index={previewIndex}
          onClose={() => setPreviewIndex(null)}
          onIndexChange={setPreviewIndex}
          title="Package photo"
        />
      )}
    </div>
  );
}
