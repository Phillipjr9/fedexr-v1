import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronDown, Menu, User, Package, ShoppingCart, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Shipping', href: '/shipping', hasDropdown: true },
  { label: 'Tracking', href: '/tracking', hasDropdown: true },
  { label: 'Design & Print', href: '/design-print', hasDropdown: true },
  { label: 'Locations', href: '/locations', hasDropdown: true },
  { label: 'Support', href: '/support', hasDropdown: true },
];

const dropdownLinks: Record<string, { label: string; href: string }[]> = {
  'Shipping': [
    { label: 'Get a Quote', href: '/rate-calculator' },
    { label: 'Create Shipment', href: '/shipping/create' },
    { label: 'Schedule Pickup', href: '/shipping' },
    { label: 'Shipping Rates', href: '/rate-calculator' },
    { label: 'Returns', href: '/returns' },
  ],
  'Tracking': [
    { label: 'Track a Package', href: '/tracking' },
    { label: 'Delivery Manager', href: '/tracking' },
    { label: 'View History', href: '/dashboard' },
  ],
  'Design & Print': [
    { label: 'Business Cards', href: '/design-print' },
    { label: 'Posters & Banners', href: '/design-print' },
    { label: 'Upload File', href: '/design-print' },
  ],
  'Locations': [
    { label: 'Find a Location', href: '/locations' },
    { label: 'Drop Boxes', href: '/locations' },
    { label: 'Hold for Pickup', href: '/locations' },
  ],
  'Support': [
    { label: 'Contact Us', href: '/support' },
    { label: 'FAQs', href: '/support' },
    { label: 'File a Claim', href: '/returns' },
  ],
};

const quickLinks = [
  { label: 'Dashboard', href: '/dashboard', icon: User },
  { label: 'Store', href: '/store', icon: ShoppingCart },
  { label: 'Returns', href: '/returns', icon: RotateCcw },
];

export default function Header() {
  const { t, i18n } = useTranslation();
  const labelKeyMap: Record<string, string> = {
    'Shipping': 'shipping',
    'Tracking': 'tracking',
    'Design & Print': 'design_print',
    'Locations': 'locations',
    'Support': 'support',
  };
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'shadow-lg' : ''
      }`}
    >
      {/* Top bar with quick links */}
      <div className="bg-fedex-purple-dark hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-end space-x-6 py-2">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                to={link.href}
                className="flex items-center text-white/80 text-xs hover:text-white transition-colors"
              >
                <link.icon className="h-3 w-3 mr-1" />
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="bg-fedex-purple">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold tracking-tight">
                <span className="text-white">Fed</span>
                <span className="text-fedex-orange">Ex</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => setActiveDropdown(item.label)}
                  onMouseLeave={() => setActiveDropdown(null)}
                >
                      <Link
                        to={item.href}
                        className="flex items-center px-4 py-2 text-white text-sm font-medium hover:bg-white/10 rounded transition-colors duration-200"
                      >
                        {t(`nav.${labelKeyMap[item.label]}`) || item.label}
                        {item.hasDropdown && (
                          <ChevronDown className="ml-1 h-4 w-4" />
                        )}
                      </Link>

                  {/* Dropdown */}
                  <AnimatePresence>
                    {item.hasDropdown && activeDropdown === item.label && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-xl border border-gray-100 overflow-hidden"
                      >
                        <div className="py-2">
                          {dropdownLinks[item.label]?.map((link) => (
                            <Link
                              key={link.label}
                              to={link.href}
                              className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-fedex-purple transition-colors"
                            >
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Show language selector only on non-admin pages */}
              {!location.pathname.startsWith('/admin') && (
                <div className="hidden sm:block">
                  <select
                    aria-label="Language selector"
                    onChange={(e) => i18n.changeLanguage(e.target.value)}
                    value={i18n.language || 'en'}
                    className="mr-4 rounded-md px-2 py-1 text-sm"
                  >
                    <option value="en">EN</option>
                    <option value="es">ES</option>
                    <option value="fr">FR</option>
                    <option value="de">DE</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
              )}
              {/* Dashboard quick link */}
              <Link
                to="/dashboard"
                className="hidden md:flex items-center text-white text-sm font-medium hover:bg-white/10 px-3 py-2 rounded transition-colors duration-200"
              >
                <Package className="mr-2 h-4 w-4" />
                Dashboard
              </Link>

              {/* Sign Up / Log In */}
              <Link
                to="/login"
                className="hidden sm:flex items-center text-white text-sm font-medium hover:bg-white/10 px-4 py-2 rounded transition-colors duration-200"
              >
                <User className="mr-2 h-4 w-4" />
                Sign Up or Log In
              </Link>

              {/* Search */}
              <button
                className="text-white hover:bg-white/10 p-2 rounded transition-colors duration-200"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Mobile menu button */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    className="lg:hidden text-white hover:bg-white/10 p-2 rounded transition-colors duration-200"
                    aria-label="Menu"
                  >
                    <Menu className="h-6 w-6" />
                  </button>
                </SheetTrigger>
                <SheetContent side="right" className="w-80 bg-fedex-purple border-none overflow-y-auto">
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                      <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                        <span className="text-2xl font-bold">
                          <span className="text-white">Fed</span>
                          <span className="text-fedex-orange">Ex</span>
                        </span>
                      </Link>
                    </div>

                    {/* Quick Links */}
                    <div className="mb-6 pb-6 border-b border-white/20">
                      <p className="text-white/60 text-xs uppercase mb-3">Quick Links</p>
                      <div className="space-y-2">
                        {quickLinks.map((link) => (
                          <Link
                            key={link.label}
                            to={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center text-white text-sm py-2 px-4 hover:bg-white/10 rounded transition-colors"
                          >
                            <link.icon className="mr-3 h-4 w-4" />
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>

                    <nav className="flex flex-col space-y-2">
                      {navItems.map((item, index) => (
                        <motion.div
                          key={item.label}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            to={item.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="block text-white text-lg font-medium py-3 px-4 hover:bg-white/10 rounded transition-colors"
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      ))}
                    </nav>

                    <div className="mt-auto pt-6">
                      <Link
                        to="/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center text-white text-lg font-medium py-3 px-4 hover:bg-white/10 rounded transition-colors"
                      >
                        <User className="mr-3 h-5 w-5" />
                        Sign Up or Log In
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
