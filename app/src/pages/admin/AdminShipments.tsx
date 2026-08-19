import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { apiListShipments, apiSaveShipment, apiAddEvent, apiMarkPaid, apiDeleteShipment } from "@/lib/adminApi";
import { FEDEX_SERVICES, generateTrackingNumber } from "@/lib/places";
import { PACKAGE_SIZES, formatFee, quoteFee } from "@/lib/shippingRates";

export default function AdminShipments() {
  const [list, setList] = useState<any[]>([]);
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [status, setStatus] = useState("Label created");
  const [location, setLocation] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [deliveryWindow, setDeliveryWindow] = useState("");
  const [notifyEmail, setNotifyEmail] = useState("");
  const [packageSize, setPackageSize] = useState(PACKAGE_SIZES[0]?.id || "medium");
  const [serviceId, setServiceId] = useState(FEDEX_SERVICES[0]?.id || "FEDEX_GROUND");
  const [collectPayment, setCollectPayment] = useState(false);
  const [manualFee, setManualFee] = useState("");
  const serviceLabel = FEDEX_SERVICES.find((s) => s.id === serviceId)?.label || serviceId;
  const quoted = quoteFee(packageSize, serviceLabel);
  const feeNum = manualFee.trim() ? Number(manualFee) : quoted;

  async function refresh() {
    try {
      setList(await apiListShipments());
    } catch (e: any) {
      toast.error(e.message || "Load failed");
    }
  }
  useEffect(() => {
    refresh();
  }, []);

  function deliveryLabel() {
    if (!deliveryDate) return "";
    const d = new Date(deliveryDate + "T12:00:00");
    const datePart = d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const windows: Record<string, string> = {
      morning: "Morning (8:00 AM – 12:00 PM)",
      afternoon: "Afternoon (12:00 PM – 5:00 PM)",
      evening: "Evening (5:00 PM – 8:00 PM)",
      all_day: "All day (8:00 AM – 8:00 PM)",
    };
    return windows[deliveryWindow] ? `${datePart} · ${windows[deliveryWindow]}` : datePart;
  }

  async function createShipment() {
    if (!origin.trim() || !destination.trim()) return toast.error("From and To required");
    const number = generateTrackingNumber();
    const del = deliveryLabel();
    try {
      await apiSaveShipment({
        number,
        status: "Label created",
        origin: origin.trim(),
        destination: destination.trim(),
        service: serviceLabel,
        serviceId,
        location: origin.trim(),
        currentLocation: origin.trim(),
        estimatedDelivery: del,
        estimatedDeliveryText: del,
        shippingFee: Number.isFinite(feeNum) ? feeNum : quoted,
        packageSize,
        collectPayment: collectPayment ? "true" : "false",
        notifyEmail: notifyEmail.trim(),
        notifyEnabled: !!notifyEmail.trim(),
      } as any);
      toast.success(`Created ${number}`);
      setEditing(number);
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Create failed");
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const del = deliveryLabel();
    try {
      await apiSaveShipment({
        number: editing,
        status,
        origin: origin.trim(),
        destination: destination.trim(),
        service: serviceLabel,
        serviceId,
        location: location.trim() || origin.trim(),
        currentLocation: location.trim() || origin.trim(),
        estimatedDelivery: del,
        estimatedDeliveryText: del,
        shippingFee: Number.isFinite(feeNum) ? feeNum : quoted,
        packageSize,
        collectPayment: collectPayment ? "true" : "false",
        notifyEmail: notifyEmail.trim(),
        notifyEnabled: !!notifyEmail.trim(),
      } as any);
      await apiAddEvent({
        number: editing,
        status,
        location: location.trim() || origin.trim(),
        details: status,
      });
      toast.success("Saved — notification sent if email is set");
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Save failed");
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-semibold">Shipments</h1>
        <p className="text-sm text-gray-500">
          Labels, delivery windows, and status notification emails.
        </p>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">From</label>
            <Input value={origin} onChange={(e) => setOrigin(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">To</label>
            <Input value={destination} onChange={(e) => setDestination(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Service</label>
            <select
              className="w-full border rounded h-10 px-2"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              {FEDEX_SERVICES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Package size</label>
            <select
              className="w-full border rounded h-10 px-2"
              value={packageSize}
              onChange={(e) => setPackageSize(e.target.value)}
            >
              {PACKAGE_SIZES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Delivery date</label>
            <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Delivery window</label>
            <select
              className="w-full border rounded h-10 px-2"
              value={deliveryWindow}
              onChange={(e) => setDeliveryWindow(e.target.value)}
            >
              <option value="">None</option>
              <option value="morning">Morning (8 AM – 12 PM)</option>
              <option value="afternoon">Afternoon (12 – 5 PM)</option>
              <option value="evening">Evening (5 – 8 PM)</option>
              <option value="all_day">All day</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-500">Status notification email</label>
            <Input
              type="email"
              value={notifyEmail}
              onChange={(e) => setNotifyEmail(e.target.value)}
              placeholder="customer@email.com"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Emails on status update when RESEND_API_KEY is set. Customers can also opt in on tracking.
            </p>
          </div>
        </div>
        <label className="flex gap-2 text-sm items-center">
          <input
            type="checkbox"
            checked={collectPayment}
            onChange={(e) => setCollectPayment(e.target.checked)}
          />
          Require payment before tracking advances
        </label>
        <p className="text-sm">
          Quoted fee: <strong>{formatFee(quoted)}</strong>
        </p>
        <Input
          type="number"
          placeholder="Manual fee override"
          value={manualFee}
          onChange={(e) => setManualFee(e.target.value)}
        />
        <Button onClick={createShipment} className="bg-[#FF6200] text-white">
          Create label
        </Button>
      </div>

      {editing && (
        <div className="bg-white border rounded-xl p-5 space-y-3">
          <p className="font-medium text-sm">
            Update — <span className="font-mono">{editing}</span>
          </p>
          <select
            className="w-full border rounded h-10 px-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {[
              "Label created",
              "Picked up",
              "In transit",
              "At facility",
              "Out for delivery",
              "Delivered",
              "Held at location",
              "Exception",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <Input
            placeholder="Location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
          <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          <select
            className="w-full border rounded h-10 px-2"
            value={deliveryWindow}
            onChange={(e) => setDeliveryWindow(e.target.value)}
          >
            <option value="">No window</option>
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="all_day">All day</option>
          </select>
          <Input
            type="email"
            value={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.value)}
            placeholder="Notify email"
          />
          <Button onClick={saveEdit} className="bg-[#FF6200] text-white">
            Save update (notifies if email set)
          </Button>
        </div>
      )}

      <div className="bg-white border rounded-xl p-5">
        <p className="font-medium text-sm mb-3">All shipments</p>
        <ul className="divide-y text-sm">
          {list.map((s) => (
            <li key={s.number} className="py-3 flex flex-wrap justify-between gap-2">
              <div>
                <p className="font-mono">{s.number}</p>
                <p className="text-gray-500">
                  {s.status}
                  {s.estimatedDelivery ? ` · ${s.estimatedDelivery}` : ""}
                </p>
                <p className="text-xs text-gray-400">
                  {s.origin} → {s.destination}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditing(s.number);
                    setOrigin(s.origin || "");
                    setDestination(s.destination || "");
                    setStatus(s.status || "Label created");
                    setLocation(s.currentLocation || "");
                    setNotifyEmail(s.notifyEmail || "");
                  }}
                >
                  Edit
                </Button>
                {s.collectPayment && !s.feePaid && (
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        await apiMarkPaid(s.number);
                        toast.success("Marked paid");
                        refresh();
                      } catch (e: any) {
                        toast.error(e.message);
                      }
                    }}
                  >
                    Mark paid
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="text-red-700"
                  onClick={async () => {
                    if (!confirm("Delete?")) return;
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
