import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

const features = [
  { title: 'Innovative solutions for reliability & speed', description: "Whether it's across states or worldwide, we prioritize the secure and swift arrival of your shipments." },
  { title: 'Premium shipping at professional rates', description: 'When you need reliable delivery and careful handling, trust FedEx to get your items where they need to go on time.' },
  { title: 'We ship everywhere*', description: 'From major cities to remote locations, your goods can reach worldwide.' },
  { title: 'Wallet-friendly shipping with no weighing', description: 'FedEx can ship your packages for less than the Post Office. With FedEx One Rate®, you get flat-rate, 2-day shipping for packages up to 50 lbs.' },
];

export default function WhyShipSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <FadeInOnScroll>
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-10">Why ship with FedEx?</h2>
            </FadeInOnScroll>
            <div className="grid sm:grid-cols-2 gap-8">
              {features.map((feature, index) => (
                <FadeInOnScroll key={feature.title} delay={index * 0.1}>
                  <div>
                    <h3 className="text-lg font-semibold text-fedex-purple mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </FadeInOnScroll>
              ))}
            </div>
            <FadeInOnScroll delay={0.4}>
              <div className="mt-8">
                <Link to="/shipping" className="inline-flex items-center text-fedex-link font-semibold text-sm uppercase tracking-wide hover:text-fedex-link-dark">
                  Start shipping now <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </FadeInOnScroll>
          </div>
          <FadeInOnScroll direction="left" delay={0.2}>
            <img src="/images/fedex-employee.jpg" alt="FedEx delivery professional" className="w-full h-auto rounded-lg shadow-lg object-cover" loading="lazy" />
          </FadeInOnScroll>
        </div>
      </div>
    </section>
  );
}
