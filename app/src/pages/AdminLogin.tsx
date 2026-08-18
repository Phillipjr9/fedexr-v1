import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() || 'admin', password }),
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
    }
  };

  return (
    <div className="min-h-screen bg-fedex-gray flex items-center justify-center py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>
        <p className="text-sm text-gray-600 mb-4">Enter staff username and password from your server env.</p>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff username</label>
            <Input name="admin-username" autoComplete="off" placeholder="Staff username" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
            <Input name="admin-password" type="password" autoComplete="new-password" placeholder="Enter admin password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="bg-fedex-purple text-white">Sign in</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
