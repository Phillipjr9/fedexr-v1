import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Enter the email on your account'); return; }
    toast.success(`If an account exists for ${email}, a reset link will be sent.`);
  };
  return (
    <div className="min-h-screen bg-[#f4f4f4] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-2xl font-semibold mb-2">Forgot password</h1>
        <p className="text-sm text-gray-600 mb-6">We will send reset instructions to your email.</p>
        <form onSubmit={submit} className="space-y-4">
          <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" className="w-full bg-[#4D148C] text-white">Send reset link</Button>
        </form>
        <p className="text-sm mt-4"><Link to="/login" className="text-[#007AB8] hover:underline">Back to sign in</Link></p>
      </div>
    </div>
  );
}
