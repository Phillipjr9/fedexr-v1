/** AEM template: Home Page */
import { useMemo } from 'react';
import AlertBanner from '@/components/AlertBanner';
import HeroSection from '@/sections/HeroSection';
import WhyShipSection from '@/sections/WhyShipSection';
import DeliveryOptionsSection from '@/sections/DeliveryOptionsSection';
import DeliveryManagerSection from '@/sections/DeliveryManagerSection';
import AppleWatchSection from '@/sections/AppleWatchSection';
import ComparisonSection from '@/sections/ComparisonSection';
import BusinessAdvantageSection from '@/sections/BusinessAdvantageSection';
import SustainabilitySection from '@/sections/SustainabilitySection';
import RewardsSection from '@/sections/RewardsSection';
import NoticesSection from '@/sections/NoticesSection';
import { getBanner } from '@/lib/adminStore';

export default function HomePage() {
  const banner = useMemo(() => getBanner(), []);
  return (
    <>
      <HeroSection />
      {banner.enabled && banner.message ? (
        <AlertBanner message={banner.message} linkText={banner.linkText || 'Learn more'} linkHref={banner.linkHref || '/support'} />
      ) : (
        <AlertBanner message="US Supreme Court Tariff Update." linkText="See how this may impact you" linkHref="/support/tariffs" />
      )}
      <WhyShipSection />
      <DeliveryOptionsSection />
      <DeliveryManagerSection />
      <AppleWatchSection />
      <ComparisonSection />
      <BusinessAdvantageSection />
      <SustainabilitySection />
      <RewardsSection />
      <NoticesSection />
    </>
  );
}
