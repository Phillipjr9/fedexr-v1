import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ShipmentWizard from '@/components/wizard/ShipmentWizard';

export default function CreateShipmentPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const signedIn = typeof window !== 'undefined' && Boolean(sessionStorage.getItem('fx_user'));

  useEffect(() => {
    if (!sessionStorage.getItem('fx_user')) {
      navigate('/login?next=/shipping/create', { replace: true });
    }
  }, [navigate]);

  if (!signedIn) {
    return (
      <div className="min-h-screen bg-[#f3f3f3] py-16 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-3">Sign in to create a shipment</h1>
        <p className="text-gray-600 mb-6">Only signed-in customers can create a shipment. Staff tracking numbers are created in Admin.</p>
        <Link to="/login?next=/shipping/create" className="inline-block bg-[#4D148C] text-white px-5 py-2 rounded">Sign in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f3f3] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8 text-center">{t('shipment.title')}</h1>
        <ShipmentWizard />
      </div>
    </div>
  );
}
