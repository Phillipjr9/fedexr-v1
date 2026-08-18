import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './i18n';
import { Toaster } from 'sonner';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LiveChat from '@/components/chat/LiveChat';
import HomePage from '@/pages/HomePage';
import ShippingPage from '@/pages/ShippingPage';
import TrackingPage from '@/pages/TrackingPage';
import DesignPrintPage from '@/pages/DesignPrintPage';
import LocationsPage from '@/pages/LocationsPage';
import SupportPage from '@/pages/SupportPage';
import LoginPage from '@/pages/LoginPage';
import RateCalculator from '@/pages/RateCalculator';
import AdminSettings from '@/pages/admin/AdminSettings';
import AdminLogin from '@/pages/AdminLogin';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminShipments from '@/pages/admin/AdminShipments';
import AdminBanner from '@/pages/admin/AdminBanner';
import CreateShipmentPage from '@/pages/CreateShipmentPage';
import UserDashboard from '@/components/dashboard/UserDashboard';
import SuppliesStore from '@/components/store/SuppliesStore';
import ReturnsPortal from '@/components/returns/ReturnsPortal';
import StaticContentPage from '@/pages/StaticContentPage';
import TrackMultiplePage from '@/pages/TrackMultiplePage';
import TrackReferencePage from '@/pages/TrackReferencePage';
import TrackScanPage from '@/pages/TrackScanPage';
import DeliveryManagerActionPage from '@/pages/DeliveryManagerActionPage';
import PickupPage from '@/pages/PickupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import './App.css';

function PublicShell() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="pt-[72px] flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/shipping" element={<ShippingPage />} />
          <Route path="/shipping/create" element={<CreateShipmentPage />} />
          <Route path="/shipping/pickup" element={<PickupPage />} />
          <Route path="/tracking" element={<TrackingPage />} />
          <Route path="/tracking/multiple" element={<TrackMultiplePage />} />
          <Route path="/tracking/reference" element={<TrackReferencePage />} />
          <Route path="/tracking/scan" element={<TrackScanPage />} />
          <Route path="/delivery-manager/hold" element={<DeliveryManagerActionPage />} />
          <Route path="/delivery-manager/instructions" element={<DeliveryManagerActionPage />} />
          <Route path="/delivery-manager/redirect" element={<DeliveryManagerActionPage />} />
          <Route path="/delivery-manager/updates" element={<DeliveryManagerActionPage />} />
          <Route path="/design-print" element={<DesignPrintPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/support/tariffs" element={<StaticContentPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/rate-calculator" element={<RateCalculator />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/store" element={<SuppliesStore />} />
          <Route path="/returns" element={<ReturnsPortal />} />
          <Route path="/about" element={<StaticContentPage />} />
          <Route path="/careers" element={<StaticContentPage />} />
          <Route path="/investors" element={<StaticContentPage />} />
          <Route path="/newsroom" element={<StaticContentPage />} />
          <Route path="/responsibility" element={<StaticContentPage />} />
          <Route path="/sitemap" element={<StaticContentPage />} />
          <Route path="/legal/terms" element={<StaticContentPage />} />
          <Route path="/legal/privacy" element={<StaticContentPage />} />
          <Route path="/legal/ad-choices" element={<StaticContentPage />} />
        </Routes>
      </main>
      <Footer />
      <LiveChat />
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="shipments" element={<AdminShipments />} />
          <Route path="banner" element={<AdminBanner />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
      </Routes>
    );
  }
  return <PublicShell />;
}

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors closeButton />
      <AppRoutes />
    </Router>
  );
}
