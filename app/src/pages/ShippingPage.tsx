import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4D148C] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-light mb-3">Shipping</h1>
          <p className="text-white/85 max-w-2xl">Create a shipment, get rates, schedule a pickup, or drop off a package.</p>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-10 grid sm:grid-cols-2 gap-6">
        {[
          { title: 'Create a shipment', to: '/shipping/create', body: 'Enter from/to details and print a label.' },
          { title: 'Get rates', to: '/rate-calculator', body: 'Compare service times and prices.' },
          { title: 'Schedule a pickup', to: '/shipping/pickup', body: 'Request a driver pickup.' },
          { title: 'Find a drop-off', to: '/locations', body: 'Search FedEx locations near you.' },
        ].map((c) => (
          <div key={c.to} className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">{c.title}</h2>
            <p className="text-sm text-gray-600 mb-4">{c.body}</p>
            <Button asChild className="bg-[#4D148C] text-white"><Link to={c.to}>Continue</Link></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
