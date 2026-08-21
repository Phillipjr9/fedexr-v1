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
  HOLD_REASONS,
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
  const [holdReasonId, setHoldReasonId] = useState('');
  const [holdReasonCustom, setHoldReasonCustom] = useState('');
  const [holdProofUploading, setHoldProofUploading] = useState(false);

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
    const hr = String(s.holdReason || '');
    const match = HOLD_REASONS.find((r) => r.label === hr || r.id === hr);
    setHoldReasonId(match ? match.id : hr ? 'other' : '');
    setHoldReasonCustom(match ? '' : hr);
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
      const isHold = /hold|exception/i.test(editStatus);
      const reasonLabel = isHold
        ? (holdReasonId === 'other'
            ? holdReasonCustom.trim()
            : HOLD_REASONS.find((r) => r.id === holdReasonId)?.label || holdReasonCustom.trim())
        : '';
      if (isHold && !reasonLabel) {
        toast.error('Select or enter a hold / exception reason');
        setSaving(false);
        return;
      }
      const detailLine = [reasonLabel, editMessage.trim()].filter(Boolean).join(' · ') || editStatus;
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
        holdReason: reasonLabel,
        skipEvent: true,
      } as any);
      await apiAddEvent({
        number: editing,
        status: editStatus,
        location: loc,
        details: detailLine,
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

  async function onHoldProof(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setHoldProofUploading(true);
    try {
      const blob = await compressImage(file);
      const dataUrl = await blobToDataUrl(blob);
      await apiUploadImage(editing, dataUrl, 'hold');
      toast.success('Hold proof photo uploaded');
      await refreshGallery(editing);
    } catch (err: any) {
      toast.error(err.message || 'Could not upload hold proof');
    } finally {
      setHoldProofUploading(false);
      e.target.value = '';
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
        <p className="text-sm text-gray-500">Create labels, fees, holds, photos, and status updates.</p>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-4">
        <p className="font-medium text-sm">{editing ? `Editing ${editing}` : 'New shipment / fee settings'}</p>
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
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={loadRouteStops} disabled={loadingRoute} variant="outline">
            {loadingRoute ? 'Loading route…' : 'Load route stops'}
          </Button>
          {!editing && (
            <Button type="button" onClick={createShipment} disabled={saving} className="bg-[#FF6200] hover:bg-[#e55a00] text-white">
              {saving ? 'Saving…' : 'Create label'}
            </Button>
          )}
        </div>
        {routeStops.length > 0 && (
          <div className="border rounded-lg p-3 max-h-48 overflow-auto text-sm space-y-1">
            {routeStops.map((stop, i) => (
              <label key={i} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!selectedStops[i]} onChange={(e) => setSelectedStops((prev) => ({ ...prev, [i]: e.target.checked }))} />
                <span>{stop.name || stop.label || stop.short || stop.city || 'Stop'}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {editing && (
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <p className="font-medium text-sm">Update status — <span className="font-mono">{editing}</span></p>
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
              <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} placeholder="City, ST" />
            </div>
          </div>

          {/hold|exception/i.test(editStatus) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/80 p-4 space-y-3">
              <p className="text-sm font-semibold text-amber-950">Hold / exception reason (required)</p>
              <p className="text-xs text-amber-900/80">Shown on customer tracking progress.</p>
              <select
                className="w-full border border-amber-200 rounded-md h-10 px-2 text-sm bg-white"
                value={holdReasonId}
                onChange={(e) => setHoldReasonId(e.target.value)}
              >
                <option value="">Select a reason…</option>
                {HOLD_REASONS.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
              {(holdReasonId === 'other' || !holdReasonId) && (
                <Input
                  className="bg-white"
                  value={holdReasonCustom}
                  onChange={(e) => setHoldReasonCustom(e.target.value)}
                  placeholder="Custom reason"
                />
              )}
              <label className="flex items-center gap-2 text-sm border border-amber-200 rounded-md px-3 h-10 cursor-pointer hover:bg-white bg-white/80 w-fit">
                <input type="file" accept="image/*" className="hidden" onChange={onHoldProof} disabled={holdProofUploading} />
                {holdProofUploading ? 'Uploading…' : 'Upload hold proof (optional)'}
              </label>
            </div>
          )}

          <div>
            <label className="text-xs text-gray-500">Scan / note</label>
            <Input value={editMessage} onChange={(e) => setEditMessage(e.target.value)} placeholder="Optional detail" />
          </div>
          <Button type="button" onClick={saveEdit} disabled={saving} className="bg-[#FF6200] hover:bg-[#e55a00] text-white">
            {saving ? 'Saving…' : 'Save update'}
          </Button>

          <div className="border-t pt-4 space-y-3">
            <p className="font-medium text-sm">Package photos</p>
            <label className="inline-flex items-center gap-2 text-sm border rounded-md px-3 h-10 cursor-pointer hover:bg-gray-50">
              <input type="file" accept="image/*" multiple className="hidden" onChange={onUploadMany} disabled={uploading} />
              {uploading ? 'Uploading…' : 'Choose photo(s)'}
            </label>
            {gallery.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {gallery.map((img, idx) => (
                  <div key={img.id} className="relative border rounded-lg overflow-hidden cursor-pointer" onClick={() => setPreviewIndex(idx)}>
                    <img src={img.dataUrl} alt={`Photo ${idx + 1}`} className="w-full h-28 object-cover" />
                    <button type="button" className="absolute top-1 right-1 bg-white/90 rounded p-1" onClick={(e) => removePhoto(img.id, e)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-white border rounded-xl p-5">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-3">
          <p className="font-medium text-sm">All shipments</p>
          <Input className="max-w-xs" placeholder="Search" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {loading && <p className="text-sm text-gray-500">Loading…</p>}
        <ul className="divide-y text-sm">
          {filtered.map((s) => (
            <li key={s.number} className="py-4 flex flex-wrap justify-between gap-3">
              <div>
                <p className="font-mono">{s.number}</p>
                <p className="text-gray-500">{s.status}{s.holdReason ? ` · ${s.holdReason}` : ''}</p>
                <p className="text-xs text-gray-400">{s.origin} → {s.destination}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => loadForEdit(s)}>
                  <Pencil className="h-4 w-4 mr-1" /> Edit
                </Button>
                {s.collectPayment && !s.feePaid && (
                  <Button type="button" variant="outline" className="text-green-800 border-green-300" onClick={async () => {
                    try {
                      await apiMarkPaid(s.number);
                      toast.success('Marked paid');
                      refresh();
                    } catch (e: any) {
                      toast.error(e.message);
                    }
                  }}>Mark paid</Button>
                )}
                <Button type="button" variant="outline" className="text-red-700 border-red-200" onClick={async () => {
                  if (!confirm('Delete?')) return;
                  try {
                    await apiDeleteShipment(s.number);
                    refresh();
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }}>Remove</Button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {previewIndex != null && previewUrls[previewIndex] && (
        <ImageLightbox images={previewUrls} index={previewIndex} onClose={() => setPreviewIndex(null)} onIndexChange={setPreviewIndex} title="Package photo" />
      )}
    </div>
  );
}
