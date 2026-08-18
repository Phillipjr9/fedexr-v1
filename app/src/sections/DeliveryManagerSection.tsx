import TwoColumnSection from '@/components/TwoColumnSection';

export default function DeliveryManagerSection() {
  return (
    <TwoColumnSection
      title="Get deliveries on your terms"
      description="Now's the time to refresh your FedEx Delivery Manager® preferences. Confirm or add addresses, update where packages should be left, and more. Not enrolled?"
      ctaText="Sign up now"
      ctaLink="/login"
      secondaryCta={{ text: 'Review Preferences', link: '/tracking' }}
      image="/images/delivery-manager.jpg"
      imageAlt="Package delivery at home"
      imagePosition="left"
      background="white"
    />
  );
}
