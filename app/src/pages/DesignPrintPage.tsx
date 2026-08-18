import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function DesignPrintPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4D148C] text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-light mb-2">Design & Print</h1>
          <p className="text-white/85">FedEx Office services for copies, business cards, signs, and banners.</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-10 grid sm:grid-cols-2 gap-6">
        {['Copies & printing', 'Business cards', 'Signs & banners', 'Document finishing'].map((t) => (
          <div key={t} className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-2">{t}</h2>
            <p className="text-sm text-gray-600 mb-4">Available at FedEx Office locations.</p>
            <Button asChild className="bg-[#4D148C] text-white"><Link to="/locations">Find a FedEx Office</Link></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
