import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Enter email and password');
      return;
    }
    if (!isLogin && (!firstName.trim() || !lastName.trim())) {
      toast.error('Enter your first and last name');
      return;
    }
    setBusy(true);
    try {
      const path = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
          name: `${firstName} ${lastName}`.trim(),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json.error || (isLogin ? 'Sign in failed' : 'Could not create account'));
        return;
      }
      sessionStorage.setItem('fx_user', JSON.stringify(json.user));
      toast.success(isLogin ? 'Signed in' : 'Account created');
      navigate(params.get('next') || '/dashboard');
    } catch {
      toast.error('Could not reach the account service');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-lg border p-8">
        <div className="text-center mb-6">
          <Link to="/" className="text-3xl font-bold"><span className="text-[#4D148C]">Fed</span><span className="text-[#FF6600]">Ex</span></Link>
          <p className="text-sm text-gray-500 mt-2">Customer account</p>
        </div>
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-semibold rounded-md ${isLogin ? 'bg-[#4D148C] text-white' : ''}`}>Sign In</button>
          <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-semibold rounded-md ${!isLogin ? 'bg-[#4D148C] text-white' : ''}`}>Create account</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3" autoComplete="off">
          {!isLogin && (
            <>
              <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </>
          )}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" disabled={busy} className="w-full bg-[#4D148C] text-white">
            {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </Button>
        </form>
        <p className="text-sm mt-4"><Link to="/forgot-password" className="text-[#007AB8] hover:underline">Forgot password</Link></p>
        <p className="text-xs text-gray-500 mt-6 text-center">Staff only: <Link to="/admin" className="text-[#4D148C] underline">Admin sign in</Link></p>
      </div>
    </div>
  );
}
