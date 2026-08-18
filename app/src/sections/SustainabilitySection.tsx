import TwoColumnSection from '@/components/TwoColumnSection';

export default function SustainabilitySection() {
  return (
    <TwoColumnSection
      title="Ship more responsibly"
      description="Using reusable packaging supports Earth Day and your sustainability goals. It can also help you cut costs and boost efficiency."
      ctaText="Get free packaging"
      ctaLink="/shipping"
      image="/images/sustainability.jpg"
      imageAlt="Eco-friendly reusable packaging materials"
      imagePosition="right"
      background="white"
    />
  );
}
