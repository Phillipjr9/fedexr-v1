import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LiveChat() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen((v) => !v)} className="fixed bottom-5 right-5 z-40 bg-[#4D148C] text-white rounded-full h-12 w-12 flex items-center justify-center shadow-lg" aria-label="Chat">
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
      </button>
      {open && (
        <div className="fixed bottom-20 right-5 z-40 w-72 bg-white border rounded-lg shadow-xl p-4">
          <p className="font-semibold mb-2">Need help?</p>
          <p className="text-sm text-gray-600 mb-3">Track a package or contact support.</p>
          <Link to="/tracking" className="block text-sm text-[#007AB8] hover:underline">Track</Link>
          <Link to="/support#contact" className="block text-sm text-[#007AB8] hover:underline">Contact support</Link>
        </div>
      )}
    </>
  );
}
