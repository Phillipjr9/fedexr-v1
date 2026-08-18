import { useState } from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, Clock, Globe, ChevronRight, Calculator, MapPin, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

import { getDeliveryDate } from '@/lib/time';

const shippingServices = [
  {
    id: 'sameday',
    icon: Clock,
    title: 'FedEx SameDay',
    description: 'Delivery in hours for urgent shipments',
  },
  {
    id: 'overnight',
    icon: Truck,
    title: 'FedEx Overnight',
    description: 'Next-business-day delivery by 8 a.m.',
  },
  {
    id: '2day',
    icon: Package,
    title: 'FedEx 2Day',
    description: 'Delivery in 2 business days',
  },
  {
    id: 'international',
    icon: Globe,
    title: 'FedEx International',
    description: 'Shipping to over 220 countries',
  },
];

const quickLinks = [
  { icon: Calculator, label: 'Get a Quote', href: '/rate-calculator' },
  { icon: Package, label: 'Create a Shipment', href: '/shipping/create' },
  { icon: MapPin, label: 'Schedule a Pickup', href: '/shipping/pickup' },
  { icon: CreditCard, label: 'View Rates', href: '/rate-calculator' },
];

export default function ShippingPage() {
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');
  const [weight, setWeight] = useState('');

  const handleGetRates = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Getting rates from ${fromZip} to ${toZip} for ${weight} lbs`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-fedex-purple py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
                Ship with confidence
              </h1>
              <p className="text-lg text-white/80 mb-8">
                From envelopes to freight, we have the right shipping solution for every need. 
                Get reliable delivery with real-time tracking.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/rate-calculator">
                  <Button className="bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                    Get a Quote
                  </Button>
                </Link>
                <Link to="/shipping/create">
                  <Button variant="outline" className="border-white text-white hover:bg-white/10 font-semibold uppercase tracking-wide px-8 py-6">
                    Ship Now
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Quick Rate Calculator */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-lg shadow-xl p-6 md:p-8"
            >
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Quick Rate Calculator
              </h2>
              <form onSubmit={handleGetRates} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From ZIP
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter ZIP"
                      value={fromZip}
                      onChange={(e) => setFromZip(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      To ZIP
                    </label>
                    <Input
                      type="text"
                      placeholder="Enter ZIP"
                      value={toZip}
                      onChange={(e) => setToZip(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Package Weight (lbs)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter weight"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold uppercase tracking-wide py-6"
                >
                  Get Rates
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-fedex-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {quickLinks.map((link, index) => (
              <FadeInOnScroll key={link.label} delay={index * 0.1}>
                <Link to={link.href}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    className="bg-white rounded-lg shadow-card p-6 text-center cursor-pointer hover:shadow-card-hover transition-shadow"
                  >
                    <div className="w-12 h-12 mx-auto mb-4 bg-fedex-purple/10 rounded-full flex items-center justify-center">
                      <link.icon className="h-6 w-6 text-fedex-purple" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{link.label}</span>
                  </motion.div>
                </Link>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Services */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-12">
              Choose your shipping service
            </h2>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {shippingServices.map((service, index) => (
              <FadeInOnScroll key={service.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:border-fedex-purple hover:shadow-card transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 bg-fedex-purple/10 rounded-full flex items-center justify-center mb-4">
                    <service.icon className="h-7 w-7 text-fedex-purple" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{service.description}</p>
                  <div className="flex items-center text-fedex-link font-medium text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    {getDeliveryDate(service.id)}
                  </div>
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FedEx One Rate */}
      <section className="py-16 bg-fedex-purple">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                FedEx One Rate®
              </h2>
              <p className="text-lg text-white/80 mb-6">
                Simple, flat-rate shipping for packages up to 50 lbs. No weighing or calculating 
                needed. Just pick your packaging and ship.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Flat rate pricing based on packaging type',
                  'Free packaging available',
                  'Delivered in 1-3 business days',
                  'No surprise fees',
                ].map((item) => (
                  <li key={item} className="flex items-start text-white/80">
                    <ChevronRight className="h-5 w-5 text-fedex-orange mr-2 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/rate-calculator">
                <Button className="bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                  Learn More
                </Button>
              </Link>
            </FadeInOnScroll>
            <FadeInOnScroll direction="left">
              <div className="bg-white/10 rounded-lg p-8">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { size: 'Small', price: '$9.50' },
                    { size: 'Medium', price: '$12.35' },
                    { size: 'Large', price: '$16.80' },
                    { size: 'Extra Large', price: '$24.55' },
                  ].map((box) => (
                    <div key={box.size} className="bg-white rounded-lg p-4 text-center">
                      <p className="text-sm text-gray-500 mb-1">{box.size}</p>
                      <p className="text-2xl font-bold text-fedex-purple">{box.price}</p>
                    </div>
                  ))}
                </div>
                <p className="text-center text-white/60 text-sm mt-4">
                  Starting prices for FedEx One Rate
                </p>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Packaging Supplies */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <img
                src="/images/sustainability.jpg"
                alt="FedEx Packaging Supplies"
                className="rounded-lg shadow-lg"
              />
            </FadeInOnScroll>
            <FadeInOnScroll direction="left">
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
                Free packaging supplies
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Order free FedEx Express packaging and supplies to ensure your shipments 
                arrive safely and on time.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Boxes, envelopes, and tubes',
                  'Packing materials and tape',
                  'Labels and documentation pouches',
                  'Temperature-controlled packaging',
                ].map((item) => (
                  <li key={item} className="flex items-start text-gray-600">
                    <ChevronRight className="h-5 w-5 text-fedex-purple mr-2 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="bg-fedex-purple hover:bg-fedex-purple-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                Order Supplies
              </Button>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
    </div>
  );
}
