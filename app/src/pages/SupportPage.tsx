import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const faqs = [
  { q: 'How do I track a package?', a: 'Enter your tracking number on the Tracking page.' },
  { q: 'Why isn\'t my tracking number working?', a: 'New labels can take a few hours to appear.' },
  { q: 'What does Exception mean?', a: 'A delay or issue needs attention. Check the scan history.' },
  { q: 'How do I hold a package?', a: 'From tracking results, choose Hold at a FedEx location after you sign in.' },
];

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4D148C] text-white py-12 px-4">
        <div className="max-w-3xl mx-auto"><h1 className="text-4xl font-light">Customer support</h1></div>
      </div>
      <div className="max-w-3xl mx-auto px-4 py-10 space-y-10">
        <section id="faqs">
          <h2 className="text-xl font-semibold mb-4">FAQs</h2>
          {faqs.map((f) => (
            <div key={f.q} className="border-b py-4">
              <p className="font-medium">{f.q}</p>
              <p className="text-sm text-gray-600 mt-1">{f.a}</p>
            </div>
          ))}
        </section>
        <section id="contact">
          <h2 className="text-xl font-semibold mb-4">Contact us</h2>
          <form className="space-y-3 max-w-md" onSubmit={(e) => { e.preventDefault(); if (!name || !email || !message) { toast.error('Fill in all contact fields'); return; } toast.success('Message sent'); }}>
            <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <textarea className="w-full border rounded p-2 min-h-24" placeholder="Message" value={message} onChange={(e) => setMessage(e.target.value)} />
            <Button type="submit" className="bg-[#4D148C] text-white">Send</Button>
          </form>
        </section>
        <Link to="/tracking" className="text-[#007AB8] hover:underline">Track a package</Link>
      </div>
    </div>
  );
}
