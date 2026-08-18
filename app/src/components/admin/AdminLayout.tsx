import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { LayoutDashboard, Package, Megaphone, Settings, LogOut } from 'lucide-react';
import { isAdminLoggedIn, logoutAdmin } from '@/lib/adminStore';

const links = [
  { to: '/admin/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/admin/shipments', label: 'Shipments', icon: Package },
  { to: '/admin/banner', label: 'Banner', icon: Megaphone },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdminLoggedIn()) navigate('/admin', { replace: true });
  }, [navigate]);

  const handleLogout = () => {
    logoutAdmin();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-[#f4f4f4] flex">
      <aside className="w-64 bg-[#4D148C] text-white flex flex-col">
        <div className="px-6 py-5 border-b border-white/10">
          <p className="text-xs uppercase tracking-widest text-white/60">Back office</p>
          <p className="text-lg font-semibold">
            Fed<span className="text-[#FF6600]">Ex</span> Admin
          </p>
        </div>
        <nav className="flex-1 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-6 py-3 text-sm ${
                  isActive ? 'bg-white/15 font-semibold' : 'text-white/80 hover:bg-white/10'
                }`
              }
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-6 py-4 text-sm text-white/80 hover:bg-white/10 border-t border-white/10"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>
      <div className="flex-1 min-w-0">
        <header className="bg-white border-b px-8 py-4">
          <p className="text-sm text-gray-500">Not visible on the public FedEx site</p>
        </header>
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
