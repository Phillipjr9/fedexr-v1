import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getAdminPassword, setAdminPassword } from '@/lib/adminStore';

export default function AdminSettings() {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 6) { toast.error('Use at least 6 characters'); return; }
    if (next !== confirm) { toast.error('New passwords do not match'); return; }
    if (!setAdminPassword(current, next)) { toast.error('Current password is incorrect'); return; }
    setCurrent(''); setNext(''); setConfirm('');
    toast.success('Password updated');
  };
  return (
    <div className="max-w-xl bg-white rounded-lg border p-6">
      <h1 className="text-xl font-semibold mb-2">Admin settings</h1>
      <p className="text-sm text-gray-500 mb-6">Server login uses ADMIN_USERNAME / ADMIN_PASSWORD. This page updates the local session password.</p>
      <form onSubmit={save} className="space-y-4">
        <div><label className="text-sm font-medium">Current password</label><Input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} /></div>
        <div><label className="text-sm font-medium">New password</label><Input type="password" value={next} onChange={(e) => setNext(e.target.value)} /></div>
        <div><label className="text-sm font-medium">Confirm new password</label><Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></div>
        <Button type="submit" className="bg-[#4D148C] text-white">Update password</Button>
      </form>
    </div>
  );
}
