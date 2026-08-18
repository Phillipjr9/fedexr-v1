import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function UserDashboard() {
  let user: any = null;
  try { user = JSON.parse(sessionStorage.getItem('fx_user') || 'null'); } catch { user = null; }
  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="bg-[#4D148C] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-light">Welcome{user?.name ? `, ${user.name}` : ''}</h1>
          <p className="text-white/80 mt-1">{user?.email || 'Sign in to manage shipments'}</p>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8 grid sm:grid-cols-3 gap-4">
        <Button asChild className="bg-[#4D148C] text-white"><Link to="/shipping/create">Create shipment</Link></Button>
        <Button asChild variant="outline"><Link to="/tracking">Track</Link></Button>
        <Button asChild variant="outline"><Link to="/returns">Returns</Link></Button>
      </div>
    </div>
  );
}
