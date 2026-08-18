import TwoColumnSection from '@/components/TwoColumnSection';

export default function DeliveryOptionsSection() {
  return (
    <TwoColumnSection
      subtitle="When time is tight, overnight"
      title="Delivery options built for busy schedules"
      description="Important last-minute documents? Tax deadline around the corner? Take your pick from early morning, mid-morning, or afternoon delivery the next business day."
      ctaText="Ship overnight"
      ctaLink="/shipping"
      image="/images/delivery-options.jpg"
      imageAlt="FedEx express delivery van"
      imagePosition="right"
      background="gray"
    />
  );
}
