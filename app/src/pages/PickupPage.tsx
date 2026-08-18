import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function PickupPage() {
  const [zip, setZip] = useState('');
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zip || !date || !name || !phone) { toast.error('Fill in pickup ZIP, date, name, and phone'); return; }
    toast.success('Pickup request saved.');
  };
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4D148C] text-white py-12 px-4">
        <div className="max-w-[720px] mx-auto">
          <h1 className="text-3xl font-light mb-2">Schedule a pickup</h1>
        </div>
      </div>
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <form onSubmit={submit} className="space-y-4 max-w-md">
          <div><label className="text-sm font-medium">Pickup ZIP</label><Input value={zip} onChange={(e) => setZip(e.target.value)} className="mt-1" /></div>
          <div><label className="text-sm font-medium">Pickup date</label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" /></div>
          <div><label className="text-sm font-medium">Contact name</label><Input value={name} onChange={(e) => setName(e.target.value)} className="mt-1" /></div>
          <div><label className="text-sm font-medium">Phone</label><Input value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1" /></div>
          <Button type="submit" className="bg-[#4D148C] text-white">Request pickup</Button>
          <Button asChild variant="outline"><Link to="/locations">Drop off instead</Link></Button>
        </form>
      </div>
    </div>
  );
}
