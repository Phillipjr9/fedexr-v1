import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ShipmentWizard() {
  const [step, setStep] = useState(1);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [weight, setWeight] = useState('1');
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="bg-[#4D148C] text-white py-10 px-4">
        <div className="max-w-2xl mx-auto"><h1 className="text-3xl font-light">Create a shipment</h1></div>
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8 bg-white mt-6 rounded-lg border p-6 space-y-4">
        <p className="text-sm text-gray-500">Step {step} of 3</p>
        {step === 1 && (
          <>
            <Input placeholder="From address or ZIP" value={from} onChange={(e) => setFrom(e.target.value)} />
            <Input placeholder="To address or ZIP" value={to} onChange={(e) => setTo(e.target.value)} />
            <Button type="button" className="bg-[#4D148C] text-white" onClick={() => { if (!from || !to) { toast.error('Enter from and to'); return; } setStep(2); }}>Continue</Button>
          </>
        )}
        {step === 2 && (
          <>
            <Input placeholder="Weight (lbs)" value={weight} onChange={(e) => setWeight(e.target.value)} />
            <Button type="button" className="bg-[#4D148C] text-white" onClick={() => setStep(3)}>Continue</Button>
          </>
        )}
        {step === 3 && (
          <>
            <p>From {from} to {to}, {weight} lb.</p>
            <Button type="button" className="bg-[#FF6600] text-white" onClick={() => toast.success('Shipment started. Sign in to finish payment.')}>Create label</Button>
            <Button asChild variant="outline"><Link to="/login?next=/shipping/create">Sign in</Link></Button>
          </>
        )}
      </div>
    </div>
  );
}
