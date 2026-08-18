import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const items = [
  { name: 'Small box', price: 1.25 },
  { name: 'Medium box', price: 2.15 },
  { name: 'Padded mailer', price: 0.95 },
  { name: 'Packing tape', price: 3.5 },
];

export default function SuppliesStore() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#4D148C] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto"><h1 className="text-3xl font-light">Packaging & supplies</h1></div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8 grid sm:grid-cols-2 gap-4">
        {items.map((i) => (
          <div key={i.name} className="border rounded-lg p-5 flex justify-between items-center">
            <div><p className="font-semibold">{i.name}</p><p className="text-sm text-gray-500">${i.price.toFixed(2)}</p></div>
            <Button asChild className="bg-[#4D148C] text-white"><Link to="/login?next=/store">Add</Link></Button>
          </div>
        ))}
      </div>
    </div>
  );
}
