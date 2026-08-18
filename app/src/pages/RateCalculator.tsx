import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, MapPin, Package, Scale, Calendar, ChevronRight, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

import { getDeliveryDate } from '@/lib/time';

const shippingOptions = [
  {
    id: 'sameday',
    service: 'FedEx SameDay',
    price: '$75.00',
    features: ['Delivery in hours', 'Available 24/7', 'Real-time tracking'],
    recommended: false,
  },
  {
    id: 'overnight',
    service: 'FedEx First Overnight',
    price: '$95.50',
    features: ['Early morning delivery', 'Money-back guarantee', 'Signature required'],
    recommended: false,
  },
  {
    id: 'priority',
    service: 'FedEx Priority Overnight',
    price: '$65.25',
    features: ['Morning delivery', 'Money-back guarantee', 'Real-time tracking'],
    recommended: true,
  },
  {
    id: 'standard',
    service: 'FedEx Standard Overnight',
    price: '$52.75',
    features: ['Afternoon delivery', 'Money-back guarantee', 'Real-time tracking'],
    recommended: false,
  },
  {
    id: '2day',
    service: 'FedEx 2Day',
    price: '$28.50',
    features: ['Economy option', 'Real-time tracking', 'Delivery confirmation'],
    recommended: false,
  },
  {
    id: 'ground',
    service: 'FedEx Ground',
    price: '$12.35',
    features: ['Most economical', 'Real-time tracking', 'Delivery confirmation'],
    recommended: false,
  },
];

export default function RateCalculator() {
  const [fromZip, setFromZip] = useState('');
  const [toZip, setToZip] = useState('');
  const [weight, setWeight] = useState('');
  const [dimensions, setDimensions] = useState({ length: '', width: '', height: '' });
  const [showResults, setShowResults] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);
    
    // Simulate calculation
    setTimeout(() => {
      setIsCalculating(false);
      setShowResults(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-fedex-purple py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Calculator className="h-16 w-16 text-white mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
              Shipping Rate Calculator
            </h1>
            <p className="text-lg text-white/80">
              Get instant shipping rates for your package. Compare services and choose the best option.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Calculator Form */}
      <section className="py-12 bg-fedex-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <form onSubmit={handleCalculate} className="bg-white rounded-lg shadow-lg p-8">
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                {/* From ZIP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    From ZIP Code
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter ZIP"
                    value={fromZip}
                    onChange={(e) => setFromZip(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>

                {/* To ZIP */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    To ZIP Code
                  </label>
                  <Input
                    type="text"
                    placeholder="Enter ZIP"
                    value={toZip}
                    onChange={(e) => setToZip(e.target.value)}
                    className="w-full"
                    required
                  />
                </div>
              </div>

              {/* Weight */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Scale className="inline h-4 w-4 mr-1" />
                  Package Weight (lbs)
                </label>
                <Input
                  type="number"
                  placeholder="Enter weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full"
                  required
                />
              </div>

              {/* Dimensions */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Package className="inline h-4 w-4 mr-1" />
                  Dimensions (inches) - Optional
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <Input
                    type="number"
                    placeholder="Length"
                    value={dimensions.length}
                    onChange={(e) => setDimensions({ ...dimensions, length: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Width"
                    value={dimensions.width}
                    onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })}
                  />
                  <Input
                    type="number"
                    placeholder="Height"
                    value={dimensions.height}
                    onChange={(e) => setDimensions({ ...dimensions, height: e.target.value })}
                  />
                </div>
              </div>

              {/* Ship Date */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1" />
                  Ship Date
                </label>
                <Input
                  type="date"
                  className="w-full md:w-auto"
                  defaultValue={new Date().toISOString().split('T')[0]}
                />
              </div>

              <Button
                type="submit"
                disabled={isCalculating}
                className="w-full bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold uppercase tracking-wide py-6"
              >
                {isCalculating ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    Get Rates
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </Button>
            </form>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Results */}
      {showResults && (
        <section className="py-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <FadeInOnScroll>
              <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                Shipping rates from {fromZip} to {toZip}
              </h2>
              <p className="text-gray-600 mb-8">
                Package weight: {weight} lbs | Estimated delivery dates shown
              </p>
            </FadeInOnScroll>

            <div className="space-y-4">
              {shippingOptions.map((option, index) => (
                <FadeInOnScroll key={option.service} delay={index * 0.1}>
                  <motion.div
                    whileHover={{ y: -2 }}
                    className={`bg-white border-2 rounded-lg p-6 cursor-pointer transition-all ${
                      option.recommended
                        ? 'border-fedex-purple shadow-card'
                        : 'border-gray-200 hover:border-fedex-purple/50'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{option.service}</h3>
                          {option.recommended && (
                            <span className="px-3 py-1 bg-fedex-purple text-white text-xs font-semibold rounded-full">
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-2">{getDeliveryDate(option.id)}</p>
                        <div className="flex flex-wrap gap-2">
                          {option.features.map((feature) => (
                            <span
                              key={feature}
                              className="flex items-center text-sm text-gray-500"
                            >
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              {feature}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-fedex-purple">{option.price}</p>
                        <Button
                          variant={option.recommended ? 'default' : 'outline'}
                          className={`mt-2 ${
                            option.recommended
                              ? 'bg-fedex-purple hover:bg-fedex-purple-dark text-white'
                              : 'border-fedex-purple text-fedex-purple hover:bg-fedex-purple/10'
                          }`}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </FadeInOnScroll>
              ))}
            </div>

            <FadeInOnScroll delay={0.6}>
              <div className="mt-8 p-6 bg-fedex-info rounded-lg flex items-start gap-3">
                <Info className="h-5 w-5 text-fedex-link flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-700">
                    Rates shown are estimates based on the information provided. Final rates may vary 
                    based on actual package characteristics and additional services selected. 
                    <a href="#" className="text-fedex-link underline ml-1">Learn more</a>
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </section>
      )}

      {/* FedEx One Rate */}
      <section className="py-16 bg-fedex-purple">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInOnScroll>
            <h2 className="text-3xl font-light text-white mb-4">
              Try FedEx One Rate®
            </h2>
            <p className="text-white/80 mb-8">
              Simple, flat-rate shipping for packages up to 50 lbs. No weighing or calculating needed.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { size: 'Small', price: '$9.50' },
                { size: 'Medium', price: '$12.35' },
                { size: 'Large', price: '$16.80' },
                { size: 'Extra Large', price: '$24.55' },
              ].map((box) => (
                <div key={box.size} className="bg-white/10 rounded-lg p-4">
                  <p className="text-white/60 text-sm">{box.size}</p>
                  <p className="text-2xl font-bold text-white">{box.price}</p>
                </div>
              ))}
            </div>
            <Button className="bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
              Learn About One Rate
            </Button>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-2xl font-semibold text-gray-900 mb-8 text-center">
              Tips to save on shipping
            </h2>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: 'Use FedEx Packaging',
                description: 'Get free packaging supplies and ensure accurate dimensional weight calculations.',
              },
              {
                title: 'Ship Off-Peak',
                description: 'Consider shipping on Tuesdays or Wednesdays for potentially lower rates.',
              },
              {
                title: 'Create an Account',
                description: 'Save up to 30% on shipping when you open a free FedEx account.',
              },
            ].map((tip, index) => (
              <FadeInOnScroll key={tip.title} delay={index * 0.1}>
                <div className="bg-fedex-gray rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">{tip.title}</h3>
                  <p className="text-sm text-gray-600">{tip.description}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
