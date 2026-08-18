import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Enter staff username and password');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        toast.error(json.error || 'Incorrect staff username or password');
        return;
      }
      localStorage.setItem('isAdmin', 'true');
      localStorage.setItem('adminUsername', json.username);
      localStorage.setItem('adminPassword', json.secret);
      toast.success('Staff signed in');
      navigate('/admin/dashboard');
    } catch {
      toast.error('Could not reach admin login');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1030] flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <p className="text-xs uppercase tracking-widest text-[#4D148C] mb-2">Staff only</p>
        <p className="text-2xl font-bold mb-1">Fed<span className="text-[#FF6600]">Ex</span> Admin</p>
        <h1 className="text-xl font-semibold mb-2">Operations sign in</h1>
        <p className="text-sm text-gray-600 mb-6">This is not the customer login. Use the username and password from server env.</p>
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff username</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Staff password</label>
            <Input type="password" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={busy} className="w-full bg-[#4D148C] hover:bg-[#3A1070] text-white">
            {busy ? 'Signing in…' : 'Staff sign in'}
          </Button>
        </form>
        <p className="text-sm text-gray-500 mt-6 text-center">Customer? <Link to="/login" className="text-[#007AB8] underline">Sign in here</Link></p>
      </div>
    </div>
  );
}
