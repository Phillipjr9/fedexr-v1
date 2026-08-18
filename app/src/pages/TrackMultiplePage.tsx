import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function TrackMultiplePage() {
  const [text, setText] = useState('');
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const numbers = text.split(/[\s,;\n]+/).map((n) => n.trim()).filter(Boolean);
    if (!numbers.length) { toast.error('Enter at least one tracking number'); return; }
    const [first, ...rest] = numbers;
    if (rest.length) sessionStorage.setItem('fx_multi_track', JSON.stringify(rest));
    navigate(`/tracking?number=${encodeURIComponent(first)}`);
  };
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <h1 className="text-3xl font-light mb-2">Track multiple packages</h1>
        <form onSubmit={submit} className="space-y-4">
          <textarea value={text} onChange={(e) => setText(e.target.value)} className="w-full min-h-[160px] border rounded-md p-3 text-sm" />
          <Button type="submit" className="bg-[#4D148C] text-white">Track</Button>
          <Button asChild variant="outline"><Link to="/tracking">Track one package</Link></Button>
        </form>
      </div>
    </div>
  );
}
