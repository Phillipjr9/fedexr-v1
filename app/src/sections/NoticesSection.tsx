import { Link } from 'react-router-dom';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

export default function NoticesSection() {
  return (
    <section className="py-8 bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeInOnScroll>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">FedEx rate and surcharge changes</h3>
            <p className="text-sm text-gray-600">
              Learn more about <Link to="/rate-calculator" className="text-fedex-link underline">rate and surcharge changes</Link> —last updated 2/2/2026.
            </p>
          </div>
        </FadeInOnScroll>
        <FadeInOnScroll delay={0.1}>
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">FedEx money-back guarantee</h3>
            <p className="text-sm text-gray-600">
              We offer a money-back guarantee for select services. Check <Link to="/support" className="text-fedex-link underline">money-back guarantee</Link> for the latest status.
            </p>
          </div>
        </FadeInOnScroll>
      </div>
    </section>
  );
}
