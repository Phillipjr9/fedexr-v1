import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Phone, MessageCircle, Mail, ChevronRight, Package, Truck, CreditCard, User, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

const supportCategories = [
  {
    icon: Package,
    title: 'Shipping',
    description: 'Learn about shipping options, packaging, and rates',
    links: ['How to ship', 'Shipping rates', 'Packaging supplies', 'International shipping'],
  },
  {
    icon: Truck,
    title: 'Tracking',
    description: 'Track packages and manage deliveries',
    links: ['Track a package', 'Delivery times', 'Hold for pickup', 'Delivery manager'],
  },
  {
    icon: CreditCard,
    title: 'Billing & Account',
    description: 'Manage your account and billing information',
    links: ['View invoices', 'Payment options', 'Account settings', 'FedEx Rewards'],
  },
  {
    icon: User,
    title: 'Customer Service',
    description: 'Get help with your shipments and account',
    links: ['Contact us', 'File a claim', 'Request a refund', 'Feedback'],
  },
];

const faqs = [
  {
    question: 'How do I track my package?',
    answer: 'Enter your tracking number on our tracking page or use the FedEx Mobile app. You can also sign up for delivery notifications.',
  },
  {
    question: 'What are the shipping rates?',
    answer: 'Shipping rates depend on the destination, package weight, dimensions, and service type. Use our rate calculator for an accurate quote.',
  },
  {
    question: 'How do I schedule a pickup?',
    answer: 'You can schedule a pickup online through your FedEx account or by calling 1-800-Go-FedEx. Same-day pickup is available in most areas.',
  },
  {
    question: 'What is FedEx Delivery Manager?',
    answer: 'FedEx Delivery Manager is a free service that lets you customize your deliveries - schedule delivery times, redirect packages, and more.',
  },
  {
    question: 'How do I file a claim for a damaged package?',
    answer: 'You can file a claim online through your FedEx account or contact customer service. Have your tracking number and photos of the damage ready.',
  },
];

const contactMethods = [
  {
    icon: Phone,
    title: 'Call Us',
    description: '1-800-Go-FedEx (1-800-463-3339)',
    subtext: 'Available 24/7',
  },
  {
    icon: MessageCircle,
    title: 'Live Chat',
    description: 'Chat with a representative',
    subtext: 'Available 7 AM - 11 PM ET',
  },
  {
    icon: Mail,
    title: 'Email Us',
    description: 'support@fedex.com',
    subtext: 'Response within 24 hours',
  },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Searching for: ${searchQuery}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-fedex-purple py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
              How can we help you?
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Search our help center or browse topics below.
            </p>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 py-6 text-lg"
                />
                <Button
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-fedex-orange hover:bg-fedex-orange-dark text-white"
                >
                  Search
                </Button>
              </div>
            </form>

            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-white/60">
              <span>Popular:</span>
              {['Track package', 'Shipping rates', 'Change delivery', 'File a claim'].map((term) => (
                <button key={term} className="hover:text-white transition-colors underline">
                  {term}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Support Categories */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-12">
              Browse by topic
            </h2>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {supportCategories.map((category, index) => (
              <FadeInOnScroll key={category.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 hover:border-fedex-purple hover:shadow-card transition-all cursor-pointer h-full"
                >
                  <div className="w-14 h-14 bg-fedex-purple/10 rounded-full flex items-center justify-center mb-4">
                    <category.icon className="h-7 w-7 text-fedex-purple" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{category.description}</p>
                  <ul className="space-y-2">
                    {category.links.map((link) => (
                      <li key={link}>
                        <a href="#" className="text-sm text-fedex-link hover:text-fedex-link-dark flex items-center">
                          <ChevronRight className="h-4 w-4 mr-1" />
                          {link}
                        </a>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-fedex-gray">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-12">
              Frequently asked questions
            </h2>
          </FadeInOnScroll>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <FadeInOnScroll key={index} delay={index * 0.05}>
                <motion.div
                  initial={false}
                  className="bg-white rounded-lg shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-semibold text-gray-900">{faq.question}</span>
                    <ChevronRight
                      className={`h-5 w-5 text-gray-400 transition-transform ${
                        expandedFaq === index ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                  {expandedFaq === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-6 pb-4"
                    >
                      <p className="text-gray-600">{faq.answer}</p>
                    </motion.div>
                  )}
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>

          <div className="text-center mt-8">
            <Button variant="outline" className="border-fedex-purple text-fedex-purple hover:bg-fedex-purple/10">
              View All FAQs
            </Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4">
              Contact us
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Can&apos;t find what you&apos;re looking for? Reach out to our support team.
            </p>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-3 gap-6">
            {contactMethods.map((method, index) => (
              <FadeInOnScroll key={method.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white border border-gray-200 rounded-lg p-8 text-center hover:border-fedex-purple hover:shadow-card transition-all"
                >
                  <div className="w-16 h-16 mx-auto mb-4 bg-fedex-purple/10 rounded-full flex items-center justify-center">
                    <method.icon className="h-8 w-8 text-fedex-purple" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{method.title}</h3>
                  <p className="text-gray-600 mb-1">{method.description}</p>
                  <p className="text-sm text-gray-400">{method.subtext}</p>
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-16 bg-fedex-purple">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <h2 className="text-3xl md:text-4xl font-light text-white mb-6">
                Additional resources
              </h2>
              <div className="space-y-4">
                {[
                  { title: 'Service Guide', description: 'Complete guide to FedEx services and rates' },
                  { title: 'Terms & Conditions', description: 'Shipping terms and conditions' },
                  { title: 'Prohibited Items', description: 'Items that cannot be shipped with FedEx' },
                  { title: 'Customs Forms', description: 'International shipping documentation' },
                ].map((resource) => (
                  <a
                    key={resource.title}
                    href="#"
                    className="flex items-center justify-between bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors"
                  >
                    <div>
                      <h3 className="font-semibold text-white">{resource.title}</h3>
                      <p className="text-sm text-white/60">{resource.description}</p>
                    </div>
                    <ExternalLink className="h-5 w-5 text-white/60" />
                  </a>
                ))}
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll direction="left">
              <div className="bg-white/10 rounded-lg p-8">
                <h3 className="text-xl font-semibold text-white mb-4">Download the FedEx App</h3>
                <p className="text-white/80 mb-6">
                  Get support on the go. Track packages, get notifications, and access 
                  help resources from your mobile device.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button className="bg-black hover:bg-gray-800 text-white">
                    App Store
                  </Button>
                  <Button className="bg-black hover:bg-gray-800 text-white">
                    Google Play
                  </Button>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
    </div>
  );
}
