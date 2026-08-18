import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TwoColumnSectionProps {
  title: string;
  subtitle?: string;
  description: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCta?: { text: string; link: string };
  image: string;
  imageAlt: string;
  imagePosition: 'left' | 'right';
  background?: 'white' | 'gray';
}

export default function TwoColumnSection({
  title, subtitle, description, ctaText, ctaLink = '/', secondaryCta, image, imageAlt, imagePosition, background = 'white',
}: TwoColumnSectionProps) {
  const bg = background === 'gray' ? 'bg-[#f4f4f4]' : 'bg-white';
  const photo = <img src={image} alt={imageAlt} className="w-full h-auto rounded-lg shadow-lg object-cover" loading="lazy" />;
  return (
    <section className={`py-16 md:py-20 ${bg}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {imagePosition === 'left' && <div className="order-2 lg:order-1">{photo}</div>}
          <div className={imagePosition === 'left' ? 'order-1 lg:order-2' : ''}>
            {subtitle && <p className="text-sm font-medium text-gray-500 uppercase mb-2">{subtitle}</p>}
            <h2 className="text-2xl md:text-3xl font-light text-gray-900 mb-4">{title}</h2>
            <p className="text-base text-gray-600 mb-6">{description}</p>
            {ctaText && (
              <Link to={ctaLink} className="inline-flex items-center text-[#007AB8] font-semibold text-sm uppercase hover:underline">
                {ctaText} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
            {secondaryCta && (
              <Link to={secondaryCta.link} className="ml-4 inline-flex items-center text-[#007AB8] font-semibold text-sm uppercase hover:underline">
                {secondaryCta.text} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            )}
          </div>
          {imagePosition === 'right' && photo}
        </div>
      </div>
    </section>
  );
}
