import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const STEPS = ['Addresses', 'Package', 'Service', 'Review'];

export default function ShipmentWizard() {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    fromName: '', fromStreet: '', fromCity: '', fromZip: '', fromPhone: '',
    toName: '', toStreet: '', toCity: '', toZip: '', toPhone: '',
    weight: '1', length: '10', width: '8', height: '4',
    service: 'FedEx Ground',
  });

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [key]: e.target.value });

  const next = () => {
    if (step === 0 && (!form.fromZip || !form.toZip || !form.fromName || !form.toName)) {
      toast.error('Enter sender and recipient name plus ZIP codes');
      return;
    }
    if (step === 1 && !form.weight) {
      toast.error('Enter package weight');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4]">
      <div className="bg-[#4D148C] text-white py-10 px-4">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-white/70 mb-1">Shipping</p>
          <h1 className="text-3xl md:text-4xl font-light">Create a shipment</h1>
          <p className="text-white/80 mt-2 text-sm">Enter from/to details, package size, and a service. Sign in to finish payment and print a label.</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4 pb-16">
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {STEPS.map((label, i) => (
            <button key={label} type="button" onClick={() => i < step && setStep(i)} className={`text-xs sm:text-sm px-3 py-2 rounded-full whitespace-nowrap ${
              i === step ? 'bg-[#4D148C] text-white' : i < step ? 'bg-white border text-[#4D148C]' : 'bg-white text-gray-400'
            }`}>{i + 1}. {label}</button>
          ))}
        </div>

        <div className="bg-white border rounded-lg p-5 sm:p-8 space-y-5">
          {step === 0 && (
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h2 className="font-semibold text-[#4D148C]">From</h2>
                <Input placeholder="Full name" value={form.fromName} onChange={set('fromName')} />
                <Input placeholder="Street address" value={form.fromStreet} onChange={set('fromStreet')} />
                <Input placeholder="City" value={form.fromCity} onChange={set('fromCity')} />
                <Input placeholder="ZIP" value={form.fromZip} onChange={set('fromZip')} />
                <Input placeholder="Phone" value={form.fromPhone} onChange={set('fromPhone')} />
              </div>
              <div className="space-y-3">
                <h2 className="font-semibold text-[#4D148C]">To</h2>
                <Input placeholder="Full name" value={form.toName} onChange={set('toName')} />
                <Input placeholder="Street address" value={form.toStreet} onChange={set('toStreet')} />
                <Input placeholder="City" value={form.toCity} onChange={set('toCity')} />
                <Input placeholder="ZIP" value={form.toZip} onChange={set('toZip')} />
                <Input placeholder="Phone" value={form.toPhone} onChange={set('toPhone')} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 font-semibold">Package</div>
              <Input placeholder="Weight (lbs)" value={form.weight} onChange={set('weight')} />
              <Input placeholder="Length (in)" value={form.length} onChange={set('length')} />
              <Input placeholder="Width (in)" value={form.width} onChange={set('width')} />
              <Input placeholder="Height (in)" value={form.height} onChange={set('height')} />
              <Button asChild variant="outline"><Link to="/store">Need packaging?</Link></Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <h2 className="font-semibold">Choose a service</h2>
              {['FedEx Priority Overnight', 'FedEx 2Day', 'FedEx Ground'].map((s) => (
                <label key={s} className={`flex items-center justify-between border rounded-lg p-4 ${
                  form.service === s ? 'border-[#4D148C] bg-[#4D148C]/5' : ''
                }`}>
                  <span>{s}</span>
                  <input type="radio" name="service" checked={form.service === s} onChange={() => setForm({ ...form, service: s })} />
                </label>
              ))}
              <Link to="/rate-calculator" className="text-sm text-[#007AB8]">Compare rates</Link>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-3 text-sm">
              <h2 className="font-semibold text-base">Review</h2>
              <p><strong>From:</strong> {form.fromName}, {form.fromCity} {form.fromZip}</p>
              <p><strong>To:</strong> {form.toName}, {form.toCity} {form.toZip}</p>
              <p><strong>Package:</strong> {form.weight} lb · {form.length}x{form.width}x{form.height} in</p>
              <p><strong>Service:</strong> {form.service}</p>
              <p className="text-gray-500">Sign in to pay and print the label. This does not create an admin tracking number — staff add those in Admin → Shipments.</p>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {step > 0 && <Button type="button" variant="outline" onClick={() => setStep((s) => s - 1)}>Back</Button>}
            {step < 3 && <Button type="button" className="bg-[#4D148C] text-white" onClick={next}>Continue</Button>}
            {step === 3 && (
              <Button asChild className="bg-[#FF6600] text-white">
                <Link to={`/login?next=/shipping/create`}>Sign in to finish</Link>
              </Button>
            )}
            <Button asChild variant="outline"><Link to="/shipping">Cancel</Link></Button>
          </div>
        </div>
      </div>
    </div>
  );
}
