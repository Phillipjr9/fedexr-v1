import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, CheckCircle, ChevronRight, Truck, Gift, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

const benefits = [
  {
    icon: Truck,
    title: 'Save on Shipping',
    description: 'Get discounted rates and exclusive offers',
  },
  {
    icon: Gift,
    title: 'FedEx Rewards',
    description: 'Earn gift cards when you ship',
  },
  {
    icon: CreditCard,
    title: 'Easy Billing',
    description: 'Manage payments and view invoices',
  },
];

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPendingMessage('');
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

      if (!isLogin && res.ok) {
        sessionStorage.removeItem('fx_user');
        setPendingMessage(
          json.message ||
            'Account created. An administrator must approve your signup before you can sign in.'
        );
        toast.success('Signup submitted — waiting for admin approval');
        setIsLogin(true);
        setPassword('');
        return;
      }

      if (!res.ok) {
        if (json.pending) {
          setPendingMessage(json.error);
        }
        toast.error(json.error || 'Could not sign in');
        return;
      }

      sessionStorage.setItem('fx_user', JSON.stringify({ ...json.user, approved: true }));
      toast.success('Signed in');
      navigate(params.get('next') || '/dashboard');
    } catch {
      toast.error('Could not reach the account service');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-fedex-gray">
      <div className="grid lg:grid-cols-2 min-h-screen">
        <div className="flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-8">
              <Link to="/" className="inline-block">
                <span className="text-3xl font-bold tracking-tight">
                  <span className="text-fedex-purple">Fed</span>
                  <span className="text-fedex-orange">Ex</span>
                </span>
              </Link>
            </div>

            <div className="flex mb-8 bg-white rounded-lg p-1 shadow-sm">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(true);
                  setPendingMessage('');
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-md transition-colors ${
                  isLogin ? 'bg-fedex-purple text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLogin(false);
                  setPendingMessage('');
                }}
                className={`flex-1 py-3 text-sm font-semibold rounded-md transition-colors ${
                  !isLogin ? 'bg-fedex-purple text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {pendingMessage && (
              <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                {pendingMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-card p-8" autoComplete="off">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-gray-600 mb-6">
                {isLogin
                  ? 'Sign in after an administrator has approved your account'
                  : 'Request an account — admin approval is required before you can sign in'}
              </p>

              {!isLogin && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    name="login-email"
                    autoComplete="off"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    name="login-password"
                    autoComplete="new-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between mb-6">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-fedex-purple focus:ring-fedex-purple" />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="text-sm text-fedex-link hover:text-fedex-link-dark">
                    Forgot password?
                  </Link>
                </div>
              )}

              {!isLogin && (
                <div className="mb-6">
                  <label className="flex items-start">
                    <input type="checkbox" className="rounded border-gray-300 text-fedex-purple focus:ring-fedex-purple mt-1" required />
                    <span className="ml-2 text-sm text-gray-600">
                      I agree to the{' '}
                      <Link to="/legal/terms" className="text-fedex-link">Terms of Use</Link>
                      {' '}and{' '}
                      <Link to="/legal/privacy" className="text-fedex-link">Privacy Policy</Link>
                    </span>
                  </label>
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-fedex-purple hover:bg-fedex-purple-dark text-white font-semibold uppercase tracking-wide py-6"
              >
                {busy ? 'Please wait…' : isLogin ? 'Sign In' : 'Request account'}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                Visitors can track packages without an account on the{' '}
                <Link to="/tracking" className="text-fedex-link underline">tracking page</Link>.
              </p>
            </div>
          </motion.div>
        </div>

        <div className="hidden lg:flex items-center justify-center bg-fedex-purple p-8">
          <div className="max-w-md">
            <FadeInOnScroll>
              <h2 className="text-3xl font-light text-white mb-4">Why create a FedEx account?</h2>
              <p className="text-white/80 mb-8">
                Accounts are reviewed by staff before activation so only verified customers get aboard.
              </p>
            </FadeInOnScroll>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <FadeInOnScroll key={benefit.title} delay={index * 0.1}>
                  <motion.div whileHover={{ x: 4 }} className="flex items-start">
                    <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                      <benefit.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{benefit.title}</h3>
                      <p className="text-white/60">{benefit.description}</p>
                    </div>
                  </motion.div>
                </FadeInOnScroll>
              ))}
            </div>

            <FadeInOnScroll delay={0.4}>
              <div className="mt-8 p-6 bg-white/10 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-fedex-orange mr-2" />
                  <span className="text-white font-semibold">Admin verification</span>
                </div>
                <p className="text-white/80 text-sm">
                  After you request an account, an administrator must approve it before you can sign in or open the dashboard.
                </p>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </div>
    </div>
  );
}
