import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, User, CheckCircle, ChevronRight, Truck, Gift, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      alert(`Logging in with: ${email}`);
    } else {
      alert(`Creating account for: ${firstName} ${lastName}`);
    }
  };

  return (
    <div className="min-h-screen bg-fedex-gray">
      <div className="grid lg:grid-cols-2 min-h-screen">
        {/* Left Side - Form */}
        <div className="flex items-center justify-center p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full max-w-md"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <Link to="/" className="inline-block">
                <span className="text-3xl font-bold tracking-tight">
                  <span className="text-fedex-purple">Fed</span>
                  <span className="text-fedex-orange">Ex</span>
                </span>
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex mb-8 bg-white rounded-lg p-1 shadow-sm">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-3 text-sm font-semibold rounded-md transition-colors ${
                  isLogin
                    ? 'bg-fedex-purple text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-3 text-sm font-semibold rounded-md transition-colors ${
                  !isLogin
                    ? 'bg-fedex-purple text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-card p-8" autoComplete="off">
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                {isLogin ? 'Welcome back' : 'Create your account'}
              </h2>
              <p className="text-gray-600 mb-6">
                {isLogin
                  ? 'Sign in to access your account and track shipments'
                  : 'Join FedEx to save on shipping and earn rewards'}
              </p>

              {!isLogin && (
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
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
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {isLogin && (
                <div className="flex items-center justify-between mb-6">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-fedex-purple focus:ring-fedex-purple" />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <a href="#" className="text-sm text-fedex-link hover:text-fedex-link-dark">
                    Forgot password?
                  </a>
                </div>
              )}

              {!isLogin && (
                <div className="mb-6">
                  <label className="flex items-start">
                    <input type="checkbox" className="rounded border-gray-300 text-fedex-purple focus:ring-fedex-purple mt-1" required />
                    <span className="ml-2 text-sm text-gray-600">
                      I agree to the{' '}
                      <a href="#" className="text-fedex-link hover:text-fedex-link-dark">Terms of Use</a>
                      {' '}and{' '}
                      <a href="#" className="text-fedex-link hover:text-fedex-link-dark">Privacy Policy</a>
                    </span>
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full bg-fedex-purple hover:bg-fedex-purple-dark text-white font-semibold uppercase tracking-wide py-6"
              >
                {isLogin ? 'Sign In' : 'Create Account'}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </form>

            {/* Social Login */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 mb-4">Or continue with</p>
              <div className="flex justify-center gap-4">
                <button className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </button>
                <button className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
                  <svg className="h-6 w-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </button>
                <button className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow">
                  <svg className="h-6 w-6 text-black" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Benefits */}
        <div className="hidden lg:flex items-center justify-center bg-fedex-purple p-8">
          <div className="max-w-md">
            <FadeInOnScroll>
              <h2 className="text-3xl font-light text-white mb-4">
                Why create a FedEx account?
              </h2>
              <p className="text-white/80 mb-8">
                Join millions of customers who save time and money with a free FedEx account.
              </p>
            </FadeInOnScroll>

            <div className="space-y-6">
              {benefits.map((benefit, index) => (
                <FadeInOnScroll key={benefit.title} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-start"
                  >
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
                  <span className="text-white font-semibold">New Account Bonus</span>
                </div>
                <p className="text-white/80 text-sm">
                  Get a $10 gift card when you make your first eligible shipment with your new account.
                </p>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </div>
    </div>
  );
}
