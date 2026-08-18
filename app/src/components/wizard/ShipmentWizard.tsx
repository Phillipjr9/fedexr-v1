import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCountryList } from '@/lib/countries';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Package,
  Truck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Ruler,
  Camera,
  Upload,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast as sonnerToast } from 'sonner';

const initialFormData = {
  fromAddress: {
    name: '',
    company: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    phone: '',
  },
  toAddress: {
    name: '',
    company: '',
    street: '',
    city: '',
    state: '',
    country: '',
    zip: '',
    phone: '',
  },
  packageDetails: {
    weight: '',
    length: '',
    width: '',
    height: '',
    packaging: 'box',
    description: '',
    image: null as File | null,
  },
  service: '',
  payment: {
    cardNumber: '',
    expiry: '',
    cvv: '',
    name: '',
  },
};

import { getDeliveryDate } from '@/lib/time';
const services = [
  { id: 'sameday', name: 'FedEx SameDay', price: 75.0, icon: Truck },
  { id: 'overnight', name: 'FedEx First Overnight', price: 95.5, icon: Truck },
  { id: 'priority', name: 'FedEx Priority Overnight', price: 65.25, icon: Truck },
  { id: 'standard', name: 'FedEx Standard Overnight', price: 52.75, icon: Truck },
  { id: '2day', name: 'FedEx 2Day', price: 28.5, icon: Package },
  { id: 'ground', name: 'FedEx Ground', price: 12.35, icon: Package },
];

export default function ShipmentWizard() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { i18n } = useTranslation();
  const countries = getCountryList(i18n.language || 'en');

  const handleInputChange = (section: keyof typeof initialFormData, field: string, value: any) => {
    setFormData(prev => {
      const sectionData = prev[section] as any;
      if (typeof sectionData !== 'object' || sectionData === null) {
        return {
          ...prev,
          [section]: value,
        } as any;
      }

      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: value,
        },
      };
    });
  };

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    sonnerToast.success("Shipment created successfully!", {
      description: "Your tracking number is: 784512369874",
    });
    setIsSubmitting(false);
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.fromAddress.name && formData.fromAddress.street && formData.fromAddress.city && formData.fromAddress.zip;
      case 2:
        return formData.toAddress.name && formData.toAddress.street && formData.toAddress.city && formData.toAddress.zip;
      case 3:
        return formData.packageDetails.weight;
      case 4:
        return formData.service;
      case 5:
        return formData.payment.cardNumber && formData.payment.expiry && formData.payment.cvv;
      default:
        return true;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {[
            { num: 1, label: 'From', icon: MapPin },
            { num: 2, label: 'To', icon: MapPin },
            { num: 3, label: 'Package', icon: Package },
            { num: 4, label: 'Service', icon: Truck },
            { num: 5, label: 'Payment', icon: CreditCard },
          ].map((item) => (
            <div key={item.num} className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-colors ${step >= item.num ? 'bg-fedex-purple text-white' : 'bg-gray-200 text-gray-500'}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <span className={`text-xs ${step >= item.num ? 'text-fedex-purple font-medium' : 'text-gray-400'}`}>{item.label}</span>
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <motion.div
            className="h-full bg-fedex-purple rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 5) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          {/* Step 1: From Address */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ship From</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <Input value={formData.fromAddress.name} onChange={(e) => handleInputChange('fromAddress', 'name', e.target.value)} placeholder="Your name" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
                  <Input value={formData.fromAddress.company} onChange={(e) => handleInputChange('fromAddress', 'company', e.target.value)} placeholder="Company name" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <Input value={formData.fromAddress.street} onChange={(e) => handleInputChange('fromAddress', 'street', e.target.value)} placeholder="Street address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <Input value={formData.fromAddress.city} onChange={(e) => handleInputChange('fromAddress', 'city', e.target.value)} placeholder="City" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <Input value={formData.fromAddress.state} onChange={(e) => handleInputChange('fromAddress', 'state', e.target.value)} placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                    <Input value={formData.fromAddress.zip} onChange={(e) => handleInputChange('fromAddress', 'zip', e.target.value)} placeholder="ZIP code" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select value={formData.fromAddress.country} onChange={(e) => handleInputChange('fromAddress', 'country', e.target.value)} className="w-full border rounded-md px-3 py-2">
                    <option value="">Select country</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input value={formData.fromAddress.phone} onChange={(e) => handleInputChange('fromAddress', 'phone', e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: To Address */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Ship To</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <Input value={formData.toAddress.name} onChange={(e) => handleInputChange('toAddress', 'name', e.target.value)} placeholder="Recipient name" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company (optional)</label>
                  <Input value={formData.toAddress.company} onChange={(e) => handleInputChange('toAddress', 'company', e.target.value)} placeholder="Company name" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address *</label>
                  <Input value={formData.toAddress.street} onChange={(e) => handleInputChange('toAddress', 'street', e.target.value)} placeholder="Street address" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <Input value={formData.toAddress.city} onChange={(e) => handleInputChange('toAddress', 'city', e.target.value)} placeholder="City" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                    <Input value={formData.toAddress.state} onChange={(e) => handleInputChange('toAddress', 'state', e.target.value)} placeholder="State" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP *</label>
                    <Input value={formData.toAddress.zip} onChange={(e) => handleInputChange('toAddress', 'zip', e.target.value)} placeholder="ZIP code" />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select value={formData.toAddress.country} onChange={(e) => handleInputChange('toAddress', 'country', e.target.value)} className="w-full border rounded-md px-3 py-2">
                    <option value="">Select country</option>
                    {countries.map(c => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <Input value={formData.toAddress.phone} onChange={(e) => handleInputChange('toAddress', 'phone', e.target.value)} placeholder="(555) 123-4567" />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Package Details */}
          {step === 3 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Package Details</h2>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Packaging Type</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['box', 'envelope', 'tube', 'pallet'].map((type) => (
                      <button
                        key={type}
                        onClick={() => handleInputChange('packageDetails', 'packaging', type)}
                        className={`p-4 border-2 rounded-lg text-center capitalize transition-colors ${
                          formData.packageDetails.packaging === type
                            ? 'border-fedex-purple bg-fedex-purple/5'
                            : 'border-gray-200 hover:border-fedex-purple/50'
                        }`}
                      >
                        <Package className="h-8 w-8 mx-auto mb-2 text-fedex-purple" />
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Ruler className="inline h-4 w-4 mr-1" />
                    Weight (lbs) *
                  </label>
                  <Input
                    type="number"
                    value={formData.packageDetails.weight}
                    onChange={(e) => handleInputChange('packageDetails', 'weight', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Ruler className="inline h-4 w-4 mr-1" />
                    Dimensions (inches)
                  </label>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      type="number"
                      value={formData.packageDetails.length}
                      onChange={(e) => handleInputChange('packageDetails', 'length', e.target.value)}
                      placeholder="Length"
                    />
                    <Input
                      type="number"
                      value={formData.packageDetails.width}
                      onChange={(e) => handleInputChange('packageDetails', 'width', e.target.value)}
                      placeholder="Width"
                    />
                    <Input
                      type="number"
                      value={formData.packageDetails.height}
                      onChange={(e) => handleInputChange('packageDetails', 'height', e.target.value)}
                      placeholder="Height"
                    />
                  </div>
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Camera className="inline h-4 w-4 mr-1" />
                    Image of Goods
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-fedex-purple transition-colors cursor-pointer">
                    <input
                      type="file"
                      className="sr-only"
                      id="image-upload"
                      accept="image/*"
                      onChange={(e) => handleInputChange('packageDetails', 'image', e.target.files?.[0] || null)}
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-600">Click to upload or drag and drop</p>
                      <p className="text-sm text-gray-400">PNG, JPG up to 10MB</p>
                    </label>
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <label htmlFor="image-upload" className="inline-flex items-center px-4 py-2 bg-fedex-purple text-white rounded-md cursor-pointer hover:opacity-90">
                        Choose image
                      </label>
                      {formData.packageDetails.image ? (
                        <span className="text-sm text-gray-700">{formData.packageDetails.image.name}</span>
                      ) : (
                        <span className="text-sm text-gray-500">No file selected</span>
                      )}
                    </div>
                  </div>
                  {formData.packageDetails.image && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700">Image preview:</p>
                      <img
                        src={URL.createObjectURL(formData.packageDetails.image)}
                        alt="Preview"
                        className="mt-2 rounded-lg max-h-40"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <Input
                    value={formData.packageDetails.description}
                    onChange={(e) => handleInputChange('packageDetails', 'description', e.target.value)}
                    placeholder="What's inside the package?"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Service */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Choose a Service</h2>
              <div className="space-y-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setFormData(prev => ({ ...prev, service: service.id }))}
                    className={`w-full p-4 border-2 rounded-lg flex items-center justify-between transition-colors ${
                      formData.service === service.id
                        ? 'border-fedex-purple bg-fedex-purple/5'
                        : 'border-gray-200 hover:border-fedex-purple/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <service.icon className="h-8 w-8 text-fedex-purple mr-4" />
                      <div className="text-left">
                        <p className="font-semibold text-gray-900">{service.name}</p>
                        <p className="text-sm text-gray-500">{getDeliveryDate(service.id)}</p>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-fedex-purple">${service.price.toFixed(2)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 5: Payment */}
          {step === 5 && (
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Payment</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                  <Input value={formData.payment.cardNumber} onChange={(e) => handleInputChange('payment', 'cardNumber', e.target.value)} placeholder="1234 5678 9012 3456" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                    <Input value={formData.payment.expiry} onChange={(e) => handleInputChange('payment', 'expiry', e.target.value)} placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                    <Input value={formData.payment.cvv} onChange={(e) => handleInputChange('payment', 'cvv', e.target.value)} placeholder="123" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                  <Input value={formData.payment.name} onChange={(e) => handleInputChange('payment', 'name', e.target.value)} placeholder="Name on card" />
                </div>

                <div className="mt-6 p-4 bg-fedex-gray rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">${services.find(s => s.id === formData.service)?.price.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Insurance</span>
                      <span className="font-medium">$2.50</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fuel Surcharge</span>
                      <span className="font-medium">$3.25</span>
                    </div>
                    <div className="border-t border-gray-300 pt-2 mt-2">
                      <div className="flex justify-between text-lg font-semibold">
                        <span>Total</span>
                        <span className="text-fedex-purple">${((services.find(s => s.id === formData.service)?.price || 0) + 5.75).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep} disabled={step === 1} className="px-6">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {step < 5 ? (
              <Button onClick={nextStep} disabled={!isStepValid()} className="bg-fedex-purple hover:bg-fedex-purple-dark text-white px-6">
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!isStepValid() || isSubmitting} className="bg-fedex-orange hover:bg-fedex-orange-dark text-white px-8">
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Create Shipment
                  </>
                )}
              </Button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}