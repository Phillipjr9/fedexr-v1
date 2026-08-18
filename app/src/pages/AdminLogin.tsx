import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = username.trim();
    if (!user || !password) {
      toast.error('Enter the exact ADMIN_USERNAME and ADMIN_PASSWORD from Vercel');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin?resource=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resource: 'login', username: user, password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || 'Incorrect admin username or password');
        return;
      }
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminUsername', json.username);
      localStorage.setItem('adminPassword', json.secret);
      toast.success('Admin authenticated');
      navigate('/admin/shipments');
    } catch {
      toast.error('Could not reach admin login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-fedex-gray flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
        <p className="text-sm text-gray-600 mb-4">
          Type the same values you saved in Vercel. Username is the full ADMIN_USERNAME (including @ if it is an email).
        </p>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff username</label>
            <Input name="admin-username" autoComplete="off" placeholder="admin@fedexr.com" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin password</label>
            <Input name="admin-password" type="password" autoComplete="new-password" placeholder="ADMIN_PASSWORD" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={busy} className="bg-fedex-purple text-white">{busy ? 'Signing in…' : 'Sign in'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
