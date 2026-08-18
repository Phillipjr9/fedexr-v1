import { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Search, Clock, Phone, Package, Printer, Car, ChevronRight, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import FadeInOnScroll from '@/components/animations/FadeInOnScroll';

const locationTypes = [
  { id: 'all', label: 'All Locations' },
  { id: 'ship', label: 'Shipping Centers' },
  { id: 'office', label: 'FedEx Office' },
  { id: 'dropbox', label: 'Drop Boxes' },
  { id: 'authorized', label: 'Authorized Ship Centers' },
];

const mockLocations = [
  {
    id: 1,
    name: 'FedEx Office Print & Ship Center',
    address: '123 Main Street, New York, NY 10001',
    distance: '0.3 mi',
    hours: 'Open until 9:00 PM',
    phone: '(212) 555-0123',
    services: ['Shipping', 'Printing', 'Packaging'],
    type: 'office',
  },
  {
    id: 2,
    name: 'FedEx Ship Center',
    address: '456 Broadway, New York, NY 10013',
    distance: '0.7 mi',
    hours: 'Open until 8:00 PM',
    phone: '(212) 555-0456',
    services: ['Shipping', 'Packaging', 'Hold for Pickup'],
    type: 'ship',
  },
  {
    id: 3,
    name: 'FedEx Authorized ShipCenter',
    address: '789 Park Ave, New York, NY 10021',
    distance: '1.2 mi',
    hours: 'Open until 7:00 PM',
    phone: '(212) 555-0789',
    services: ['Shipping', 'Packaging'],
    type: 'authorized',
  },
  {
    id: 4,
    name: 'FedEx Drop Box',
    address: '321 Lexington Ave, New York, NY 10016',
    distance: '1.5 mi',
    hours: '24/7 Access',
    phone: null,
    services: ['Drop-off Only'],
    type: 'dropbox',
  },
];

const services = [
  {
    icon: Package,
    title: 'Packaging Services',
    description: 'Professional packing and supplies',
  },
  {
    icon: Printer,
    title: 'Printing Services',
    description: 'Business cards, posters, and more',
  },
  {
    icon: Car,
    title: 'Hold for Pickup',
    description: 'Have packages held for convenient pickup',
  },
  {
    icon: Clock,
    title: 'Extended Hours',
    description: 'Many locations open evenings and weekends',
  },
];

export default function LocationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setTimeout(() => {
      setIsSearching(false);
      setShowResults(true);
    }, 1000);
  };

  const filteredLocations = selectedType === 'all' 
    ? mockLocations 
    : mockLocations.filter(loc => loc.type === selectedType);

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
              Find a FedEx location
            </h1>
            <p className="text-lg text-white/80 mb-8">
              Search for nearby locations to ship, print, pack, and more.
            </p>

            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Enter ZIP code, city, or address"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 py-6 text-lg"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isSearching}
                  className="bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold uppercase tracking-wide px-8 py-6"
                >
                  {isSearching ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                    />
                  ) : (
                    <>
                      <Search className="mr-2 h-5 w-5" />
                      Find
                    </>
                  )}
                </Button>
              </div>
            </form>

            <button className="mt-4 text-white/80 hover:text-white transition-colors flex items-center justify-center mx-auto">
              <Navigation className="h-4 w-4 mr-2" />
              Use my current location
            </button>
          </motion.div>
        </div>
      </section>

      {/* Results Section */}
      {showResults && (
        <section className="py-8 bg-fedex-gray">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {locationTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedType === type.id
                      ? 'bg-fedex-purple text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Location List */}
              <div className="lg:col-span-1 space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  {filteredLocations.length} locations found near "{searchQuery}"
                </p>
                {filteredLocations.map((location) => (
                  <motion.div
                    key={location.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-lg shadow-card p-4 cursor-pointer hover:shadow-card-hover transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{location.name}</h3>
                      <span className="text-sm text-fedex-purple font-medium">{location.distance}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{location.address}</p>
                    <div className="flex items-center text-sm text-green-600 mb-2">
                      <Clock className="h-4 w-4 mr-1" />
                      {location.hours}
                    </div>
                    {location.phone && (
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Phone className="h-4 w-4 mr-1" />
                        {location.phone}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {location.services.map((service) => (
                        <span
                          key={service}
                          className="px-2 py-1 bg-fedex-gray text-xs text-gray-600 rounded"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Map Placeholder */}
              <div className="lg:col-span-2">
                <div className="bg-gray-200 rounded-lg h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Interactive Map</p>
                    <p className="text-sm text-gray-400">Showing {filteredLocations.length} locations</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Services Section */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <h2 className="text-3xl md:text-4xl font-light text-gray-900 text-center mb-4">
              Services at our locations
            </h2>
            <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
              Our locations offer a variety of services to meet your shipping and business needs.
            </p>
          </FadeInOnScroll>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <FadeInOnScroll key={service.title} delay={index * 0.1}>
                <motion.div
                  whileHover={{ y: -4 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 text-center hover:border-fedex-purple hover:shadow-card transition-all"
                >
                  <div className="w-14 h-14 mx-auto mb-4 bg-fedex-purple/10 rounded-full flex items-center justify-center">
                    <service.icon className="h-7 w-7 text-fedex-purple" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{service.title}</h3>
                  <p className="text-sm text-gray-600">{service.description}</p>
                </motion.div>
              </FadeInOnScroll>
            ))}
          </div>
        </div>
      </section>

      {/* Drop Box Section */}
      <section className="py-16 bg-fedex-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
                FedEx Drop Boxes
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Drop off your pre-labeled packages at any of our 40,000+ drop boxes 
                nationwide. Available 24/7 for your convenience.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'No waiting in line',
                  'Secure drop-off',
                  'Pickup every business day',
                  'Located in convenient places',
                ].map((item) => (
                  <li key={item} className="flex items-start text-gray-600">
                    <ChevronRight className="h-5 w-5 text-fedex-purple mr-2 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="bg-fedex-purple hover:bg-fedex-purple-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                Find Drop Boxes
              </Button>
            </FadeInOnScroll>
            <FadeInOnScroll direction="left">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Drop Box Locator</h3>
                <div className="space-y-4">
                  <Input placeholder="Enter ZIP code" />
                  <Button className="w-full bg-fedex-orange hover:bg-fedex-orange-dark text-white font-semibold">
                    Search
                  </Button>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <p className="text-sm text-gray-500">
                    Looking for a drop box? Enter your ZIP code to find the nearest location.
                  </p>
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Hold for Pickup */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <img
                src="/images/delivery-manager.jpg"
                alt="Hold for Pickup"
                className="rounded-lg shadow-lg"
              />
            </FadeInOnScroll>
            <FadeInOnScroll direction="left">
              <h2 className="text-3xl md:text-4xl font-light text-gray-900 mb-6">
                Hold for Pickup
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Have your packages held at a FedEx location for secure, convenient pickup. 
                Perfect if you&apos;re not home during delivery hours.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Pick up on your schedule',
                  'Secure package storage',
                  'Photo ID required for pickup',
                  'Free service for most shipments',
                ].map((item) => (
                  <li key={item} className="flex items-start text-gray-600">
                    <ChevronRight className="h-5 w-5 text-fedex-purple mr-2 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Button className="bg-fedex-purple hover:bg-fedex-purple-dark text-white font-semibold uppercase tracking-wide px-8 py-6">
                Learn More
              </Button>
            </FadeInOnScroll>
          </div>
        </div>
      </section>
    </div>
  );
}
