import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, Menu, Search, User, X } from 'lucide-react';
import FedExLogo from '@/components/FedExLogo';

const nav = [
  { label: 'Shipping', href: '/shipping', items: [{ label: 'Create a shipment', href: '/shipping/create' }, { label: 'Get rates', href: '/rate-calculator' }, { label: 'Schedule a pickup', href: '/shipping/pickup' }, { label: 'Returns', href: '/returns' }] },
  { label: 'Tracking', href: '/tracking', items: [{ label: 'Track a package', href: '/tracking' }, { label: 'Track multiple', href: '/tracking/multiple' }, { label: 'Delivery Manager', href: '/tracking#delivery-manager' }] },
  { label: 'Design & Print', href: '/design-print', items: [{ label: 'FedEx Office services', href: '/design-print' }] },
  { label: 'Locations', href: '/locations', items: [{ label: 'Find a location', href: '/locations' }] },
  { label: 'Support', href: '/support', items: [{ label: 'Customer support', href: '/support' }, { label: 'FAQs', href: '/support#faqs' }] },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMobileOpen(false); setOpen(null); setSearchOpen(false); }, [location.pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const value = q.trim();
    if (!value) return;
    if (/^[0-9]{10,}$/.test(value) || /^[A-Za-z0-9]{12,}$/.test(value)) navigate(`/tracking?number=${encodeURIComponent(value)}`);
    else navigate(`/support?q=${encodeURIComponent(value)}`);
    setSearchOpen(false);
    setQ('');
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 bg-white ${scrolled ? 'shadow-md' : 'border-b border-gray-200'}`}>
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 lg:h-[72px]">
          <FedExLogo height={32} />
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {nav.map((item) => (
              <div key={item.label} className="relative" onMouseEnter={() => setOpen(item.label)} onMouseLeave={() => setOpen(null)}>
                <Link to={item.href} className="flex items-center gap-1 px-3 py-2 text-[15px] font-medium text-[#333] hover:text-[#4D148C]">
                  {item.label} <ChevronDown className="h-4 w-4 opacity-70" />
                </Link>
                {open === item.label && (
                  <div className="absolute left-0 top-full pt-1 w-64">
                    <div className="bg-white border shadow-xl rounded-md py-2">
                      {item.items.map((sub) => (
                        <Link key={sub.label} to={sub.href} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">{sub.label}</Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-2 ml-auto">
            {searchOpen ? (
              <form onSubmit={submitSearch} className="flex items-center gap-2">
                <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tracking # or search" className="w-40 sm:w-56 border rounded px-3 py-1.5 text-sm" />
                <button type="button" onClick={() => setSearchOpen(false)} aria-label="Close search"><X className="h-5 w-5" /></button>
              </form>
            ) : (
              <button type="button" onClick={() => setSearchOpen(true)} className="p-2" aria-label="Search"><Search className="h-5 w-5" /></button>
            )}
            <Link to="/login" className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium"><User className="h-4 w-4" /> Sign Up / Log In</Link>
            <button className="lg:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Open menu"><Menu className="h-6 w-6" /></button>
          </div>
        </div>
        {mobileOpen && (
          <div className="lg:hidden border-t py-3 space-y-2">
            {nav.map((item) => (
              <div key={item.label}>
                <Link to={item.href} className="block px-2 py-2 font-semibold text-[#4D148C]">{item.label}</Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
