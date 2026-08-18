import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Calculator, Headphones, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { images } from '@/lib/assets';

const heroSlides = [
  { title: 'Keep your automotive supply chain moving', subtitle: 'From tires to transmissions, FedEx handles every part.', ctaText: 'GEAR UP TO SHIP', ctaLink: '/shipping', image: images.heroAutomotive },
  { title: 'Ship, manage, track, deliver', subtitle: 'Reliable shipping solutions for businesses of all sizes.', ctaText: 'START SHIPPING', ctaLink: '/shipping/create', image: images.heroShipping },
];

const quickActions = [
  { icon: Calculator, label: 'Get a quote', href: '/rate-calculator' },
  { icon: Package, label: 'Ship now', href: '/shipping/create' },
  { icon: MapPin, label: 'Find locations', href: '/locations' },
  { icon: Headphones, label: 'Contact support', href: '/support' },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide((p) => (p + 1) % heroSlides.length), 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = heroSlides[currentSlide];

  return (
    <section className="bg-white">
      <div className="relative h-[420px] md:h-[500px] overflow-hidden">
        {heroSlides.map((s, i) => (
          <img key={s.image} src={s.image} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === currentSlide ? 'opacity-100' : 'opacity-0'}`} loading={i === 0 ? 'eager' : 'lazy'} />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent" />
        <div className="relative h-full max-w-7xl mx-auto px-4 flex items-center">
          <div className="max-w-xl">
            <h1 className="text-3xl md:text-5xl font-light text-gray-900 mb-4">{slide.title}</h1>
            <p className="text-base md:text-lg text-gray-600 mb-6">{slide.subtitle}</p>
            <Link to={slide.ctaLink} className="inline-flex items-center text-[#007AB8] font-semibold text-sm uppercase hover:underline">
              {slide.ctaText} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
      <div className="relative -mt-16 z-10 max-w-5xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-5 md:p-6">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="flex flex-wrap justify-center gap-6">
              {quickActions.map((a) => (
                <Link key={a.href} to={a.href} className="flex flex-col items-center w-20 text-center group">
                  <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-[#4D148C]/10 flex items-center justify-center mb-2">
                    <a.icon className="h-6 w-6 text-gray-600 group-hover:text-[#4D148C]" />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{a.label}</span>
                </Link>
              ))}
            </div>
            <form className="flex w-full lg:flex-1 gap-2" onSubmit={(e) => { e.preventDefault(); if (trackingNumber.trim()) navigate(`/tracking?number=${encodeURIComponent(trackingNumber.trim())}`); }}>
              <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking number" className="h-11" />
              <Button type="submit" className="h-11 bg-[#FF6600] hover:bg-[#E55A00] text-white font-semibold">TRACK</Button>
            </form>
          </div>
          <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); const q = locationQuery.trim(); navigate(q ? `/locations?q=${encodeURIComponent(q)}` : '/locations'); }}>
            <Input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="ZIP or city, state" className="h-11" />
            <Button type="submit" className="h-11 bg-[#4D148C] text-white font-semibold">FIND</Button>
          </form>
        </div>
      </div>
    </section>
  );
}
