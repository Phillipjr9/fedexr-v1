import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ReturnsPortal() {
  const [number, setNumber] = useState('');
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4D148C] text-white py-10 px-4">
        <div className="max-w-xl mx-auto"><h1 className="text-3xl font-light">Returns</h1></div>
      </div>
      <div className="max-w-xl mx-auto px-4 py-8 space-y-4">
        <Input placeholder="Original tracking number" value={number} onChange={(e) => setNumber(e.target.value)} />
        <Button className="bg-[#4D148C] text-white" onClick={() => { if (!number.trim()) { toast.error('Enter a tracking number'); return; } toast.success('Return started. Sign in to finish.'); }}>
          Start a return
        </Button>
        <Button asChild variant="outline"><Link to="/tracking">Track instead</Link></Button>
      </div>
    </div>
  );
}
