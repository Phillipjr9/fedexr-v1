import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, MapPin, Clock, CheckCircle, Barcode, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

interface TrackingEvent {
  date: string;
  time: string;
  location: string;
  status: string;
  completed: boolean;
}

const mockTrackingHistory: TrackingEvent[] = [
  { date: 'Apr 2, 2026', time: '8:45 AM', location: 'New York, NY', status: 'Delivered', completed: true },
  { date: 'Apr 2, 2026', time: '6:30 AM', location: 'New York, NY', status: 'Out for delivery', completed: true },
  { date: 'Apr 2, 2026', time: '4:15 AM', location: 'Brooklyn, NY', status: 'At local facility', completed: true },
  { date: 'Apr 1, 2026', time: '11:20 PM', location: 'Newark, NJ', status: 'Departed facility', completed: true },
  { date: 'Apr 1, 2026', time: '3:45 PM', location: 'Chicago, IL', status: 'Arrived at facility', completed: true },
  { date: 'Apr 1, 2026', time: '9:00 AM', location: 'Chicago, IL', status: 'Picked up', completed: true },
];

const trackingFeatures = [
  {
    icon: Bell,
    title: 'Delivery Notifications',
    description: 'Get alerts via email, text, or the FedEx app when your package is on its way.',
  },
  {
    icon: MapPin,
    title: 'Real-Time Location',
    description: 'See exactly where your package is at any moment with GPS tracking.',
  },
  {
    icon: Clock,
    title: 'Estimated Delivery',
    description: 'Know when to expect your package with accurate delivery time estimates.',
  },
  {
    icon: Shield,
    title: 'Delivery Proof',
    description: 'View photos and signatures confirming your package was delivered.',
  },
];

export default function TrackingPage() {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [trackingResult, setTrackingResult] = useState<{
    number: string;
    status: string;
    estimatedDelivery: string;
    history: TrackingEvent[];
  } | null>(null);
  const [trackingImage, setTrackingImage] = useState<string | null>(null);
  const [adminSecret, setAdminSecret] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [eventType, setEventType] = useState<'in_transit' | 'delivered' | 'other'>('in_transit');
  const [isAdminUser, setIsAdminUser] = useState(false);

  useEffect(() => {
    try {
      setIsAdminUser(Boolean(localStorage.getItem('isAdmin')));
    } catch (e) {
      setIsAdminUser(false);
    }
  }, []);

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;

    setIsTracking(true);
    
    // Simulate API call
    setTimeout(() => {
      const result = {
        number: trackingNumber,
        status: 'Delivered',
        estimatedDelivery: 'Delivered on Apr 2, 2026',
        history: mockTrackingHistory,
      };
      setTrackingResult(result);

      // fetch image from serverless API (Neon)
      (async () => {
        try {
          const r = await fetch(`/api/get-tracking-image?number=${encodeURIComponent(trackingNumber)}`);
          if (r.ok) {
            const j = await r.json();
            if (j.found && j.dataUrl) setTrackingImage(j.dataUrl);
          }
        } catch (err) {
          // ignore
        } finally {
          setIsTracking(false);
        }
      })();
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-fedex-purple py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
              Track your package
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Enter your tracking number to see the status of your shipment in real-time.
            </p>

            <form onSubmit={handleTrack} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Barcode className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    className="w-full pl-12 py-6 text-lg"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isTracking}
                  className="bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold uppercase tracking-wide px-8 py-6"
                >
                  {isTracking ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Track
                    </>
                  )}
                </Button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/60">
              <button className="hover:text-white transition-colors flex items-center">
                <QrCode className="h-4 w-4 mr-2" />
                Scan QR Code
              </button>
              <span>|</span>
              <button className="hover:text-white transition-colors">
                Track by Reference Number
              </button>
              <span>|</span>
              <button className="hover:text-white transition-colors">
                Track Multiple Packages
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Tracking Results */}
      {trackingResult && (
        <section className="py-12 bg-fedex-gray">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              {/* Status Header */}
              <div className="bg-fedex-purple p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/60 text-sm mb-1">Tracking Number</p>
                    <p className="text-white text-xl font-semibold">{trackingResult.number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-sm mb-1">Status</p>
                    <div className="flex items-center text-white">
                      <CheckCircle className="h-5 w-5 mr-2 text-green-400" />
                      <span className="text-xl font-semibold">{trackingResult.status}</span>
                    </div>
                  </div>
                </div>
                  <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between gap-4">
                    <p className="text-white/60 text-sm">{trackingResult.estimatedDelivery}</p>
                    {trackingImage && (
                      <div className="ml-4">
                        <p className="text-white/60 text-sm mb-1">Image of goods</p>
                        <img src={trackingImage} alt="Image of goods" className="h-20 rounded-md object-cover border border-white/20" />
                      </div>
                    )}
                    {/* Admin upload control: render only for admin users */}
                    {isAdminUser && (
                      <div className="ml-6">
                        <p className="text-white/60 text-sm mb-1">Admin upload</p>
                        <div className="flex items-center gap-2">
                          <input id="tracking-image-upload" type="file" accept="image/*" className="rounded-md" />
                          <select value={eventType} onChange={(e) => setEventType(e.target.value as any)} className="rounded-md px-2 py-2 border">
                            <option value="in_transit">In Transit</option>
                            <option value="delivered">Delivered (Proof of Delivery)</option>
                            <option value="other">Other</option>
                          </select>
                          <Input placeholder="Admin secret" value={adminSecret} onChange={(e) => setAdminSecret(e.target.value)} />
                          <Button
                            onClick={async () => {
                              const input = document.getElementById('tracking-image-upload') as HTMLInputElement | null;
                              const file = input?.files?.[0];
                              if (!file) { toast.error('Select an image file'); return; }
                              if (!adminSecret.trim()) { toast.error('Enter admin secret'); return; }
                              setUploading(true);
                              const reader = new FileReader();
                              reader.onload = async () => {
                                const dataUrl = reader.result as string;
                                try {
                                  const resp = await fetch('/api/upload-tracking-image', {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                      'x-admin-secret': adminSecret,
                                    },
                                    body: JSON.stringify({ trackingNumber: trackingResult.number, dataUrl, eventType }),
                                  });
                                  const json = await resp.json();
                                  if (!resp.ok) { toast.error(json?.error || 'Upload failed'); return; }
                                  setFilePreview(dataUrl);
                                  setTrackingImage(dataUrl);
                                  toast.success('Image uploaded and attached to tracking number');
                                  if (input) input.value = '';
                                } catch (err) {
                                  console.error(err);
                                  toast.error('Upload error');
                                } finally {
                                  setUploading(false);
                                }
                              };
                              reader.readAsDataURL(file);
                            }}
                            disabled={uploading}
                            className="bg-fedex-orange text-white"
                          >
                            {uploading ? 'Uploading…' : 'Attach'}
                          </Button>
                        </div>
                        {filePreview && <img src={filePreview} alt="preview" className="h-12 rounded-md mt-2" />}
                      </div>
                    )}
                  </div>
              </div>

              {/* Progress Bar */}
              <div className="px-6 py-6">
                <div className="relative">
                  <div className="flex justify-between mb-2">
                    {['Picked Up', 'In Transit', 'Out for Delivery', 'Delivered'].map((step, index) => (
                      <div key={step} className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                          index <= 3 ? 'bg-fedex-purple text-white' : 'bg-gray-200 text-gray-400'
                        }`}>
                          {index <= 3 ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <span className="text-sm">{index + 1}</span>
                          )}
                        </div>
                        <span className={`text-xs ${index <= 3 ? 'text-gray-900' : 'text-gray-400'}`}>
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-4 left-0 right-0 h-1 bg-gray-200 -z-10">
                    <div className="h-full bg-fedex-purple" style={{ width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* Tracking History */}
              <div className="px-6 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipment History</h3>
                <div className="space-y-4">
                  {trackingResult.history.map((event, index) => (
                    <div key={index} className="flex items-start">
                      <div className="flex-shrink-0 w-10">
                        <div className="w-3 h-3 bg-fedex-purple rounded-full mt-1.5" />
                        {index < trackingResult.history.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 ml-1.5 mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-semibold text-gray-900">{event.status}</p>
                        <p className="text-sm text-gray-500">{event.location}</p>
                        <p className="text-xs text-gray-400">{event.date} at {event.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Tracking Features */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4">
              Stay informed every step of the way
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Our advanced tracking technology keeps you updated on your package's journey 
              from pickup to delivery.
            </p>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trackingFeatures.map((feature, index) => (
              <FadeInOnScroll key={feature.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:border-fedex-purple hover:shadow-card transition-all"
                >
                  <div className="w-14 h-14 mx-auto mb-4 bg-fedex-purple/10 rounded-full flex items-center justify-center">
                    <feature.icon className="h-7 w-7 text-fedex-purple" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FedEx Delivery Manager */}
      <section className="py-16 bg-fedex-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
                FedEx Delivery Manager®
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Take control of your deliveries. Customize when and where your packages arrive 
                with our free delivery management tool.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Schedule deliveries for when you\'re home',
                  'Redirect packages to a different address',
                  'Hold packages at a FedEx location',
                  'Request vacation hold',
                  'Provide delivery instructions',
                ].map((item) => (
                  <li key={item} className="flex items-start text-gray-600">
                    <CheckCircle className="h-5 w-5 text-fedex-purple mr-2 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="bg-fedex-purple hover:bg-fedex-purple-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                Sign Up Free
              </Button>
            </FadeInOnScroll>
            <FadeInOnScroll direction="left">
              <img
                src="/images/delivery-manager.jpg"
                alt="FedEx Delivery Manager"
                className="rounded-lg shadow-lg"
              />
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Mobile App */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <img
                src="/images/apple-watch.jpg"
                alt="FedEx Mobile App"
                className="rounded-lg shadow-lg"
              />
            </FadeInOnScroll>
            <FadeInOnScroll direction="left">
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
                Track on the go
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Download the FedEx Mobile app to track packages, get notifications, 
                and manage deliveries from your smartphone or smartwatch.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-6">
                  Download for iOS
                </Button>
                <Button className="bg-black hover:bg-gray-800 text-white font-semibold px-6 py-6">
                  Download for Android
                </Button>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
    </div>
  );
}

// Additional icons
function Bell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

function Shield({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );
}
