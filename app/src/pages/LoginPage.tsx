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
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) { toast.error('Enter email and password'); return; }
    if (!isLogin && (!firstName.trim() || !lastName.trim())) { toast.error('Enter your first and last name'); return; }
    sessionStorage.setItem('fx_user', JSON.stringify({ email, name: firstName ? `${firstName} ${lastName}` : email }));
    toast.success(isLogin ? 'Signed in' : 'Account created');
    navigate(params.get('next') || '/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center p-8">
      <div className="w-full max-w-md bg-white rounded-lg border p-8">
        <div className="text-center mb-6">
          <Link to="/" className="text-3xl font-bold"><span className="text-[#4D148C]">Fed</span><span className="text-[#FF6600]">Ex</span></Link>
        </div>
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button type="button" onClick={() => setIsLogin(true)} className={`flex-1 py-2 text-sm font-semibold rounded-md ${isLogin ? 'bg-[#4D148C] text-white' : ''}`}>Sign In</button>
          <button type="button" onClick={() => setIsLogin(false)} className={`flex-1 py-2 text-sm font-semibold rounded-md ${!isLogin ? 'bg-[#4D148C] text-white' : ''}`}>Create account</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          {!isLogin && (
            <>
              <Input placeholder="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              <Input placeholder="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </>
          )}
          <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full bg-[#4D148C] text-white">{isLogin ? 'Sign in' : 'Create account'}</Button>
        </form>
        <p className="text-sm mt-4"><Link to="/forgot-password" className="text-[#007AB8] hover:underline">Forgot password</Link></p>
      </div>
    </div>
  );
}
