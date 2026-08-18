import TwoColumnSection from '@/components/TwoColumnSection';

export default function AppleWatchSection() {
  return (
    <TwoColumnSection
      title="Track with a twist of the wrist"
      description="Follow shipments and get real-time delivery notifications on your Apple Watch. It syncs with the FedEx® Mobile app for convenience that goes where you do."
      ctaText="Download the app"
      ctaLink="/tracking/scan"
      image="/images/apple-watch.jpg"
      imageAlt="Apple Watch with FedEx tracking app"
      imagePosition="right"
      background="gray"
    />
  );
}
