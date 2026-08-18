import { Link } from 'react-router-dom';

const columns = [
  {
    title: 'Our Company',
    links: [
      { label: 'About FedEx', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Investor Relations', href: '/investors' },
      { label: 'Newsroom', href: '/newsroom' },
      { label: 'Corporate Responsibility', href: '/responsibility' },
      { label: 'Contact Us', href: '/support#contact' },
    ],
  },
  {
    title: 'Shipping',
    links: [
      { label: 'Ship now', href: '/shipping/create' },
      { label: 'Get rates', href: '/rate-calculator' },
      { label: 'Schedule pickup', href: '/shipping' },
      { label: 'Packaging', href: '/store' },
      { label: 'Returns', href: '/returns' },
    ],
  },
  {
    title: 'Tracking',
    links: [
      { label: 'Track a package', href: '/tracking' },
      { label: 'Track multiple', href: '/tracking/multiple' },
      { label: 'Track by reference', href: '/tracking/reference' },
      { label: 'Delivery Manager', href: '/tracking#delivery-manager' },
      { label: 'FAQs', href: '/support#faqs' },
    ],
  },
  {
    title: 'More',
    links: [
      { label: 'Find locations', href: '/locations' },
      { label: 'Design & Print', href: '/design-print' },
      { label: 'Support', href: '/support' },
      { label: 'Log in', href: '/login' },
      { label: 'Site Map', href: '/sitemap' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-bold text-gray-900 mb-4">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link to={l.href} className="text-sm text-gray-600 hover:text-[#4D148C] hover:underline">{l.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">© FedEx 1995–{new Date().getFullYear()}</p>
        </div>
      </div>
    </footer>
  );
}
