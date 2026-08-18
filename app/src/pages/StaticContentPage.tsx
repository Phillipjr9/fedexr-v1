import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const pages: Record<string, { title: string; body: string; cta?: { label: string; to: string } }> = {
  '/about': { title: 'About FedEx', body: 'FedEx connects people and possibilities around the world.', cta: { label: 'Contact us', to: '/support#contact' } },
  '/careers': { title: 'Careers', body: 'Explore opportunities across operations, technology, and customer experience.', cta: { label: 'Contact support', to: '/support#contact' } },
  '/investors': { title: 'Investor Relations', body: 'Financial information and investor resources.', cta: { label: 'Back to home', to: '/' } },
  '/newsroom': { title: 'Newsroom', body: 'Company news and media resources.', cta: { label: 'Contact us', to: '/support#contact' } },
  '/responsibility': { title: 'Corporate Responsibility', body: 'Sustainability, community, and governance initiatives.', cta: { label: 'Home', to: '/' } },
  '/sitemap': { title: 'Site Map', body: 'Browse the main areas of this site.', cta: { label: 'Home', to: '/' } },
  '/legal/terms': { title: 'Terms of Use', body: 'These Terms of Use govern use of this website.' },
  '/legal/privacy': { title: 'Privacy & Security', body: 'How information collected on this site may be used.' },
  '/legal/ad-choices': { title: 'Ad Choices', body: 'Interest-based advertising choices and cookie preferences.' },
};

export default function StaticContentPage() {
  const { pathname } = useLocation();
  const page = pages[pathname] || { title: 'Page', body: 'This page is not configured yet.', cta: { label: 'Home', to: '/' } };
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4D148C] text-white py-12 px-4">
        <div className="max-w-[800px] mx-auto"><h1 className="text-3xl font-light">{page.title}</h1></div>
      </div>
      <div className="max-w-[800px] mx-auto px-4 py-10 space-y-4">
        <p className="text-gray-700">{page.body}</p>
        {page.cta && <Button asChild className="bg-[#4D148C] text-white"><Link to={page.cta.to}>{page.cta.label}</Link></Button>}
      </div>
    </div>
  );
}
