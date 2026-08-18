import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function TrackReferencePage() {
  const [reference, setReference] = useState('');
  const navigate = useNavigate();
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reference.trim()) { toast.error('Enter a shipper reference'); return; }
    toast.message('Sign in to finish reference tracking');
    navigate('/login?next=/tracking&intent=reference');
  };
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <h1 className="text-3xl font-light mb-2">Track by reference</h1>
        <form onSubmit={submit} className="space-y-4 max-w-md">
          <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          <Button type="submit" className="bg-[#4D148C] text-white">Continue</Button>
          <Button asChild variant="outline"><Link to="/tracking">Track by tracking number</Link></Button>
        </form>
      </div>
    </div>
  );
}
