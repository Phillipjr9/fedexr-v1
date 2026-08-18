import { motion } from 'framer-motion';
import { Mail, Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';
import FadeInOnScroll from './animations/FadeInOnScroll';

const companyLinks = [
  { label: 'About FedEx', href: '/support' },
  { label: 'Our Portfolio', href: '/support' },
  { label: 'Investor Relations', href: '/support' },
  { label: 'Careers', href: '/support' },
  { label: 'FedEx Blog', href: '/support' },
  { label: 'Corporate Responsibility', href: '/support' },
  { label: 'Newsroom', href: '/support' },
  { label: 'Contact Us', href: '/support' },
];

const moreLinks = [
  { label: 'FedEx Compatible', href: '/support' },
  { label: 'FedEx Developer Portal', href: '/support' },
  { label: 'FedEx Logistics', href: '/support' },
];

const socialLinks = [
  { icon: Mail, href: '/support', label: 'Email' },
  { icon: Facebook, href: '/support', label: 'Facebook' },
  { icon: Twitter, href: '/support', label: 'Twitter' },
  { icon: Instagram, href: '/support', label: 'Instagram' },
  { icon: Linkedin, href: '/support', label: 'LinkedIn' },
  { icon: Youtube, href: '/support', label: 'YouTube' },
];

const legalLinks = [
  { label: 'Site Map', href: '/support' },
  { label: 'Cookie Consent', href: '/support' },
  { label: 'Terms of Use', href: '/support' },
  { label: 'Privacy & Security', href: '/support' },
  { label: 'Ad Choices', href: '/support' },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Our Company */}
          <FadeInOnScroll>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Our Company</h3>
              <ul className="space-y-3">
                {companyLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-600 hover:text-fedex-purple transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </FadeInOnScroll>

          {/* More From FedEx */}
          <FadeInOnScroll delay={0.1}>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">More From FedEx</h3>
              <ul className="space-y-3">
                {moreLinks.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-600 hover:text-fedex-purple transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </FadeInOnScroll>

          {/* Language */}
          <FadeInOnScroll delay={0.2}>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Language</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">United States</p>
                <button className="text-sm text-fedex-link hover:text-fedex-link-dark transition-colors">
                  English
                </button>
              </div>
            </div>
          </FadeInOnScroll>

          {/* Follow FedEx */}
          <FadeInOnScroll delay={0.3}>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Follow FedEx</h3>
              <div className="flex flex-wrap gap-3">
                {socialLinks.map((social) => (
                  <Link
                    key={social.label}
                    to={social.href}
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-fedex-purple hover:text-white transition-colors"
                      aria-label={social.label}
                    >
                      <social.icon className="h-5 w-5" />
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </FadeInOnScroll>
        </div>

        {/* Bottom Bar */}
        <FadeInOnScroll delay={0.4}>
          <div className="mt-12 pt-8 border-t border-gray-200">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                © FedEx 1995-2026
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
                {legalLinks.map((link, index) => (
                  <span key={link.label} className="flex items-center">
                    <Link
                      to={link.href}
                      className="text-gray-500 hover:text-fedex-purple transition-colors"
                    >
                      {link.label}
                    </Link>
                    {index < legalLinks.length - 1 && (
                      <span className="mx-2 text-gray-300">|</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FadeInOnScroll>
      </div>
    </footer>
  );
}
