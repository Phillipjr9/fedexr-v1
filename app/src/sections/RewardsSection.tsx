import TwoColumnSection from '@/components/TwoColumnSection';

export default function RewardsSection() {
  return (
    <TwoColumnSection
      title="Ship, earn rewards, repeat"
      description="Join FedEx Rewards to earn gift cards from name-brand retailers when you ship.* Open a free FedEx account and get a $10 gift card for your first eligible shipment."
      ctaText="Open a free account"
      ctaLink="/login"
      image="/images/fedex-rewards.jpg"
      imageAlt="FedEx Rewards gift cards"
      imagePosition="left"
      background="gray"
    />
  );
}
