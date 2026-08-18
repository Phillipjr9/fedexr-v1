import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const mockLocations = [
  { id: 1, name: 'FedEx Office Print & Ship Center', address: '123 Main Street, New York, NY 10001', hours: 'Open until 9:00 PM' },
  { id: 2, name: 'FedEx Ship Center', address: '456 Broadway, New York, NY 10013', hours: 'Open until 8:00 PM' },
  { id: 3, name: 'FedEx Drop Box', address: '789 Park Ave, New York, NY 10021', hours: 'Pickup 5:00 PM' },
];

export default function LocationsPage() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') || '');
  const results = mockLocations.filter((l) => !q || `${l.name} ${l.address}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4D148C] text-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-4xl font-light mb-4">Find a location</h1>
          <form className="flex gap-2 max-w-xl" onSubmit={(e) => e.preventDefault()}>
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ZIP or city, state" className="bg-white" />
            <Button type="submit" className="bg-[#FF6600] text-white">FIND</Button>
          </form>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-4">
        {results.map((l) => (
          <div key={l.id} className="border rounded-lg p-5">
            <div className="flex gap-3">
              <MapPin className="h-5 w-5 text-[#4D148C]" />
              <div>
                <h2 className="font-semibold">{l.name}</h2>
                <p className="text-sm text-gray-600">{l.address}</p>
                <p className="text-sm text-gray-500">{l.hours}</p>
              </div>
            </div>
          </div>
        ))}
        <Button asChild variant="outline"><Link to="/shipping">Back to shipping</Link></Button>
      </div>
    </div>
  );
}
