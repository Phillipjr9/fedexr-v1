import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TrackScanPage() {
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="bg-white border-b">
        <div className="max-w-[720px] mx-auto px-4 py-10">
          <h1 className="text-3xl font-light text-gray-900 mb-2">Scan barcode or QR</h1>
          <p className="text-gray-600 mb-4">
            Camera scanning is not available in this web browser. Enter the tracking number instead.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="bg-[#4D148C] text-white">
              <Link to="/tracking">Enter tracking number</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/tracking/multiple">Track multiple packages</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
