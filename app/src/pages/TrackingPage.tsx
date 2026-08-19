import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  MapPin,
  Clock,
  CheckCircle,
  Barcode,
  QrCode,
  Package,
  Truck,
  Copy,
  Bell,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  completed?: boolean;
  details?: string;
}

const STEPS = ['Picked up', 'In transit', 'Out for delivery', 'Delivered'] as const;

function stepIndex(status: string) {
  const s = status.toLowerCase();
  if (s.includes('deliver')) return 3;
  if (s.includes('out for')) return 2;
  if (s.includes('hold') || s.includes('exception')) return 1;
  if (s.includes('pick') || s.includes('label')) return 0;
  return 1;
}

const trackingFeatures = [
  {
    icon: Bell,
    title: 'Delivery notifications',
    description: 'Get alerts when your package moves, is out for delivery, or arrives.',
  },
  {
    icon: MapPin,
    title: 'Scan location',
    description: 'See the latest facility or city from each scan on the shipment.',
  },
  {
    icon: Clock,
    title: 'Estimated delivery',
    description: 'The date your shipper or admin set for this tracking number.',
  },
  {
    icon: Shield,
    title: 'Delivery photo',
    description: 'If a delivered photo was uploaded, it appears only after delivery.',
  },
];

export default function TrackingPage() {
  const [params] = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState(params.get('number') || '');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<{
    number: string;
    status: string;
    estimatedDelivery: string;
    origin?: string;
    destination?: string;
    service?: string;
    location?: string;
    history: TrackingEvent[];
  } | null>(null);
  const [setupImage, setSetupImage] = useState<string | null>(null);
  const [deliveredImage, setDeliveredImage] = useState<string | null>(null);

  const loadImages = async (number: string, status: string) => {
    setSetupImage(null);
    setDeliveredImage(null);
    try {
      const setup = await fetch(`/api/images?number=${encodeURIComponent(number)}&event=setup`);
      if (setup.ok) {
        const j = await setup.json();
        if (j.found && j.dataUrl) setSetupImage(j.dataUrl);
      }
    } catch {
      /* optional */
    }
    if (/deliver/i.test(status)) {
      try {
        const delivered = await fetch(`/api/images?number=${encodeURIComponent(number)}&event=delivered`);
        if (delivered.ok) {
          const j = await delivered.json();
          if (j.found && j.dataUrl) setDeliveredImage(j.dataUrl);
        }
      } catch {
        /* optional */
      }
    }
  };

  const trackNumber = async (raw: string) => {
    const number = raw.trim();
    if (!number) {
      toast.error('Enter a tracking number');
      return;
    }
    setIsTracking(true);
    setTrackingResult(null);
    try {
      let result: any = null;
      const trackRes = await fetch(`/api/track?number=${encodeURIComponent(number)}`);
      const trackJson = await trackRes.json().catch(() => ({}));
      if (trackRes.ok && (trackJson.found || trackJson.status)) {
        result = {
          number: trackJson.number || number,
          status: trackJson.status || 'In transit',
          estimatedDelivery: trackJson.estimatedDelivery || '',
          origin: trackJson.origin || '',
          destination: trackJson.destination || '',
          service: trackJson.service || '',
          location: trackJson.location || '',
          history: trackJson.history || [],
        };
      } else {
        const adminRes = await fetch(`/api/admin/shipments?number=${encodeURIComponent(number)}`);
        const adminJson = await adminRes.json().catch(() => ({}));
        const shipment = adminJson.shipments?.[0];
        if (shipment) {
          result = {
            number: shipment.number,
            status: shipment.status,
            estimatedDelivery: shipment.estimatedDelivery || '',
            origin: shipment.origin || '',
            destination: shipment.destination || '',
            service: shipment.service || '',
            location: shipment.location || '',
            history: shipment.history || [],
          };
        }
      }
      if (!result) {
        toast.error('No information found for that tracking number');
        return;
      }
      setTrackingResult(result);
      await loadImages(result.number, result.status);
    } catch {
      toast.error('Unable to track right now');
    } finally {
      setIsTracking(false);
    }
  };

  useEffect(() => {
    const n = params.get('number');
    if (n) {
      setTrackingNumber(n);
      trackNumber(n);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const activeStep = useMemo(
    () => (trackingResult ? stepIndex(trackingResult.status) : 0),
    [trackingResult]
  );
  const isHeld = !!trackingResult && /hold/i.test(trackingResult.status);

  return (
    <div className="min-h-screen bg-white">
      <section className="bg-fedex-purple py-14 md:py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl md:text-5xl font-light text-white mb-4">Track your package</h1>
            <p className="text-white/80 mb-8">Enter a tracking number from your admin shipment or label.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                trackNumber(trackingNumber);
              }}
              className="max-w-2xl mx-auto"
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Barcode className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full pl-12 py-6 text-lg bg-white"
                  />
                </div>
                <Button type="submit" disabled={isTracking} className="bg-fedex-orange hover:bg-fedex-orange-dark text-white uppercase font-semibold px-8 py-6">
                  {isTracking ? 'Tracking…' : (<><Search className="mr-2 h-5 w-5" />Track</>)}
                </Button>
              </div>
            </form>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/70">
              <Link to="/tracking/scan" className="hover:text-white inline-flex items-center gap-2"><QrCode className="h-4 w-4" />Scan barcode</Link>
              <span>|</span>
              <Link to="/tracking/reference" className="hover:text-white">Track by reference</Link>
              <span>|</span>
              <Link to="/tracking/multiple" className="hover:text-white">Track multiple packages</Link>
            </div>
          </motion.div>
        </div>
      </section>

      {trackingResult && (
        <section className="py-10 bg-[#f4f4f4]">
          <div className="max-w-4xl mx-auto px-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-fedex-purple p-6 text-white">
                <div className="flex flex-wrap justify-between gap-4">
                  <div>
                    <p className="text-white/60 text-xs uppercase tracking-wide">Tracking ID</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xl font-semibold">{trackingResult.number}</p>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(trackingResult.number);
                          toast.success('Copied');
                        }}
                        className="text-white/70 hover:text-white"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-xs uppercase tracking-wide">Status</p>
                    <p className="text-xl font-semibold flex items-center justify-end gap-2">
                      {/deliver/i.test(trackingResult.status) ? <CheckCircle className="h-5 w-5 text-green-300" /> : <Truck className="h-5 w-5 text-fedex-orange" />}
                      {trackingResult.status}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm text-white/80">
                  <p><span className="text-white/50">From</span><br />{trackingResult.origin || '—'}</p>
                  <p><span className="text-white/50">To</span><br />{trackingResult.destination || '—'}</p>
                  <p><span className="text-white/50">Service</span><br />{trackingResult.service || '—'}</p>
                </div>
                {trackingResult.estimatedDelivery && (
                  <p className="mt-4 text-sm text-white/80">Scheduled delivery: {trackingResult.estimatedDelivery}</p>
                )}
              </div>

              {isHeld && (
                <div className="px-6 py-3 bg-amber-50 text-amber-900 text-sm border-b">
                  This shipment is on hold. You can request a hold or release from{' '}
                  <Link className="underline" to="/delivery-manager/hold">Delivery Manager</Link>.
                </div>
              )}

              <div className="px-6 py-6">
                <div className="relative flex justify-between">
                  {STEPS.map((step, index) => {
                    const done = index <= activeStep;
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center z-10">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                          done ? 'bg-fedex-purple text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                          {done ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>
                        <span className={`text-xs text-center ${done ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
                      </div>
                    );
                  })}
                  <div className="absolute top-4 left-[12%] right-[12%] h-1 bg-gray-200">
                    <div className="h-full bg-fedex-purple" style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }} />
                  </div>
                </div>
              </div>

              {(setupImage || deliveredImage) && (
                <div className="px-6 pb-6 grid sm:grid-cols-2 gap-4">
                  {setupImage && (
                    <div>
                      <p className="text-sm font-medium mb-2">Package photo</p>
                      <img src={setupImage} alt="Package" className="w-full max-h-56 object-cover rounded-md border" />
                    </div>
                  )}
                  {deliveredImage && (
                    <div>
                      <p className="text-sm font-medium mb-2">Proof of delivery</p>
                      <img src={deliveredImage} alt="Delivered" className="w-full max-h-56 object-cover rounded-md border" />
                    </div>
                  )}
                </div>
              )}

              <div className="px-6 pb-8">
                <h3 className="text-lg font-semibold mb-4">Travel history</h3>
                {trackingResult.history?.length ? (
                  <div className="space-y-0">
                    {trackingResult.history.map((event, index) => (
                      <div key={`${event.status}-${index}`} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-3 h-3 rounded-full bg-fedex-purple mt-1.5" />
                          {index < trackingResult.history.length - 1 && <div className="w-px flex-1 bg-gray-200" />}
                        </div>
                        <div className="pb-5">
                          <p className="font-semibold text-gray-900">{event.status}</p>
                          <p className="text-sm text-gray-600">{event.location}</p>
                          <p className="text-xs text-gray-400">{event.date}{event.time ? ` · ${event.time}` : ''}</p>
                          {event.details && <p className="text-xs text-gray-500 mt-1">{event.details}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No scan events yet. Status is {trackingResult.status}{trackingResult.location ? ` at ${trackingResult.location}` : ''}.</p>
                )}
              </div>

              <div className="px-6 py-4 border-t bg-gray-50 flex flex-wrap gap-3">
                <Button asChild variant="outline"><Link to="/delivery-manager/hold">Hold at location</Link></Button>
                <Button asChild variant="outline"><Link to="/delivery-manager/instructions">Delivery instructions</Link></Button>
                <Button asChild variant="outline"><Link to="/support">Get help</Link></Button>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4">
          <FadeInOnScroll>
            <h2 className="text-3xl font-light text-center mb-10">Stay informed every step of the way</h2>
          </FadeInOnScroll>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trackingFeatures.map((feature, index) => (
              <FadeInOnScroll key={feature.title} delay={index * 0.08}>
                <div className="border rounded-lg p-6 text-center hover:border-fedex-purple hover:shadow-md transition-all">
                  <div className="w-14 h-14 mx-auto mb-4 bg-fedex-purple/10 rounded-full flex items-center justify-center">
                    <feature.icon className="h-7 w-7 text-fedex-purple" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-[#f4f4f4]">
        <div className="max-w-7xl mx-auto px-4 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-light mb-4">FedEx Delivery Manager</h2>
            <p className="text-gray-600 mb-6">Hold, redirect, or add instructions for a delivery tied to your tracking number.</p>
            <ul className="space-y-2 mb-6 text-gray-600">
              {['Hold a package at a location', 'Add delivery instructions', 'Get delivery updates', 'Redirect a shipment'].map((item) => (
                <li key={item} className="flex gap-2"><CheckCircle className="h-5 w-5 text-fedex-purple" />{item}</li>
              ))}
            </ul>
            <Button asChild className="bg-fedex-purple text-white"><Link to="/login">Sign in to manage</Link></Button>
          </div>
          <div className="flex items-center justify-center h-56 bg-white border rounded-lg">
            <Package className="h-16 w-16 text-fedex-purple" />
          </div>
        </div>
      </section>
    </div>
  );
}
