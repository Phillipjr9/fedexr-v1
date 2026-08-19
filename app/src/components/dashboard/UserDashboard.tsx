import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let parsed: any = null;
    try {
      parsed = JSON.parse(sessionStorage.getItem('fx_user') || 'null');
    } catch {
      parsed = null;
    }
    if (!parsed?.email || parsed.approved === false) {
      sessionStorage.removeItem('fx_user');
      navigate('/login?next=/dashboard', { replace: true });
      return;
    }
    setUser(parsed);
    setReady(true);
  }, [navigate]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-[#f7f7f7] flex items-center justify-center text-sm text-gray-500">
        Checking account…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <div className="bg-[#4D148C] text-white py-10 px-4">
        <div className="max-w-4xl mx-auto flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-light">Welcome{user?.name ? `, ${user.name}` : ''}</h1>
            <p className="text-white/80 mt-1">{user?.email}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="bg-transparent border-white/40 text-white hover:bg-white/10"
            onClick={() => {
              sessionStorage.removeItem('fx_user');
              navigate('/');
            }}
          >
            Sign out
          </Button>
        </div>
      </div>
      <div className="max-w-4xl mx-auto px-4 py-8 grid sm:grid-cols-3 gap-4">
        <Button asChild className="bg-[#4D148C] text-white">
          <Link to="/shipping/create">Create shipment</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/tracking">Track</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/returns">Returns</Link>
        </Button>
      </div>
    </div>
  );
}
