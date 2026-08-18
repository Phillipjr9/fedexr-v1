import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const copy: Record<string, { title: string; body: string }> = {
  hold: { title: 'Hold at a FedEx location', body: 'Request to hold a package at a nearby location. Sign in to complete this request.' },
  instructions: { title: 'Delivery instructions', body: 'Add notes for the driver. Sign in to save instructions.' },
  redirect: { title: 'Redirect this package', body: 'Send a package to a different address. Sign in to start a redirect.' },
  updates: { title: 'Get shipment updates', body: 'Sign in to enroll in email and mobile alerts.' },
};

export default function DeliveryManagerActionPage() {
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const action = pathname.split('/').pop() || 'hold';
  const number = params.get('number') || '';
  const info = copy[action] || copy.hold;
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="max-w-[720px] mx-auto px-4 py-10">
        <h1 className="text-3xl font-light mb-2">{info.title}</h1>
        <p className="text-gray-600 mb-6">{info.body}</p>
        <Button asChild className="bg-[#4D148C] text-white"><Link to="/login">Sign in to continue</Link></Button>
        <Button asChild variant="outline"><Link to={number ? `/tracking?number=${encodeURIComponent(number)}` : '/tracking'}>Back to tracking</Link></Button>
      </div>
    </div>
  );
}
