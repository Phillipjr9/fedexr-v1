import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const services = [
  { name: 'FedEx Priority Overnight', days: '1 business day', price: 42.15 },
  { name: 'FedEx 2Day', days: '2 business days', price: 24.80 },
  { name: 'FedEx Ground', days: '3–5 business days', price: 12.45 },
];

export default function RateCalculator() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [weight, setWeight] = useState('1');
  const [quotes, setQuotes] = useState<typeof services | null>(null);
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4D148C] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto"><h1 className="text-4xl font-light">Get rates & delivery times</h1></div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <form className="grid sm:grid-cols-3 gap-3 mb-6" onSubmit={(e) => { e.preventDefault(); if (!from || !to) { toast.error('Enter from and to ZIP codes'); return; } setQuotes(services); }}>
          <Input placeholder="From ZIP" value={from} onChange={(e) => setFrom(e.target.value)} />
          <Input placeholder="To ZIP" value={to} onChange={(e) => setTo(e.target.value)} />
          <Input placeholder="Weight (lbs)" value={weight} onChange={(e) => setWeight(e.target.value)} />
          <Button type="submit" className="sm:col-span-3 bg-[#4D148C] text-white">Get rates</Button>
        </form>
        {quotes && quotes.map((s) => (
          <div key={s.name} className="border rounded-lg p-4 mb-3 flex justify-between">
            <div><p className="font-semibold">{s.name}</p><p className="text-sm text-gray-500">{s.days}</p></div>
            <p className="font-semibold">${s.price.toFixed(2)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
