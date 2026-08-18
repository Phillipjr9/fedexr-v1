import { motion } from 'framer-motion';
import { Printer, FileText, Image, PenTool, Upload, CheckCircle, ChevronRight, Palette, Ruler, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';
import ShipmentWizard from '@/components/wizard/ShipmentWizard';

const printProducts = [
  {
    icon: FileText,
    title: 'Business Cards',
    description: 'Professional cards in various finishes',
    startingPrice: '$19.99',
  },
  {
    icon: Image,
    title: 'Posters & Banners',
    description: 'Large format prints for any occasion',
    startingPrice: '$24.99',
  },
  {
    icon: Printer,
    title: 'Brochures & Flyers',
    description: 'Marketing materials that stand out',
    startingPrice: '$49.99',
  },
  {
    icon: PenTool,
    title: 'Custom Signs',
    description: 'Indoor and outdoor signage solutions',
    startingPrice: '$34.99',
  },
];

const designServices = [
  {
    title: 'Professional Design',
    description: 'Our design experts can create custom artwork for your business needs.',
    features: ['Logo design', 'Brand identity', 'Marketing materials', 'Custom illustrations'],
  },
  {
    title: 'DIY Templates',
    description: 'Choose from thousands of professionally designed templates.',
    features: ['Easy online editor', 'Customizable layouts', 'Industry-specific designs', 'Instant previews'],
  },
];

const printProcess = [
  { step: 1, title: 'Upload or Design', description: 'Upload your file or use our design tools', icon: Upload },
  { step: 2, title: 'Customize', description: 'Choose size, paper, and finishing options', icon: Palette },
  { step: 3, title: 'Review', description: 'Preview your design before printing', icon: Ruler },
  { step: 4, title: 'Print & Deliver', description: 'We print and ship to your door', icon: Truck },
];

export default function DesignPrintPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-fedex-purple to-fedex-purple-dark py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
                Design & Print
              </h1>
              <p className="text-lg text-white/80 mb-8">
                Create professional marketing materials, business cards, signs, and more. 
                Design online or upload your files for high-quality printing.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                  Start Designing
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white/10 font-semibold uppercase tracking-wide px-8 py-6">
                  Upload File
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <img
                src="/images/hero-shipping.jpg"
                alt="Design and Print Services"
                className="rounded-lg shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Print Products */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4">
              Professional printing services
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              From business cards to banners, we print everything you need to promote your business.
            </p>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {printProducts.map((product, index) => (
              <FadeInOnScroll key={product.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:border-fedex-purple hover:shadow-card transition-all cursor-pointer"
                >
                  <div className="w-14 h-14 bg-fedex-purple/10 rounded-full flex items-center justify-center mb-4">
                    <product.icon className="h-7 w-7 text-fedex-purple" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                  <p className="text-fedex-purple font-semibold">From {product.startingPrice}</p>
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Print Process */}
      <section className="py-16 bg-fedex-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-12">
              How it works
            </h2>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {printProcess.map((step, index) => (
              <FadeInOnScroll key={step.step} delay={index * 0.1}>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-fedex-purple rounded-full flex items-center justify-center">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="w-8 h-8 mx-auto -mt-12 mb-4 bg-fedex-orange rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {step.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Design Services */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {designServices.map((service, index) => (
              <FadeInOnScroll key={service.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white border border-gray-200 rounded-lg p-8 hover:shadow-card transition-all"
                >
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">{service.title}</h3>
                  <p className="text-gray-600 mb-6">{service.description}</p>
                  <ul className="space-y-3 mb-8">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-center text-gray-600">
                        <CheckCircle className="h-5 w-5 text-fedex-purple mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="bg-fedex-purple hover:bg-fedex-purple-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                    Learn More
                  </Button>
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Same-Day Services */}
      <section className="py-16 bg-fedex-purple">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                Need it today?
              </h2>
              <p className="text-lg text-white/80 mb-6">
                Order by 2 PM for same-day pickup at select FedEx Office locations. 
                Perfect for last-minute presentations, events, and emergencies.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Same-day printing available',
                  'Pickup at your nearest location',
                  'Professional quality guaranteed',
                  'Wide range of products',
                ].map((item) => (
                  <li key={item} className="flex items-start text-white/80">
                    <CheckCircle className="h-5 w-5 text-fedex-orange mr-3 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                Find a Location
              </Button>
            </FadeInOnScroll>
            <FadeInOnScroll direction="left">
              <div className="bg-white/10 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-white mb-6">Same-Day Products</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    'Business Cards',
                    'Flyers',
                    'Posters',
                    'Presentations',
                    'Signs',
                    'Banners',
                    'Brochures',
                    'Photo Prints',
                  ].map((product) => (
                    <div key={product} className="flex items-center text-white/80">
                      <ChevronRight className="h-4 w-4 text-fedex-orange mr-2" />
                      {product}
                    </div>
                  ))}
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
              Ready to get started?
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Create an account to save your designs, track orders, and reorder with ease.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button className="bg-fedex-purple hover:bg-fedex-purple-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                Create Account
              </Button>
              <Button variant="outline" className="border-fedex-purple text-fedex-purple hover:bg-fedex-purple/10 font-semibold uppercase tracking-wide px-8 py-6">
                Browse Templates
              </Button>
            </div>
          </FadeInOnScroll>
        </div>
      </section>
    </div>
  );
}

export function CreateShipmentPage() {
  return (
    <div className="min-h-screen bg-fedex-gray py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-8 text-center">Create a Shipment</h1>
        <ShipmentWizard />
      </div>
    </div>
  );
}
