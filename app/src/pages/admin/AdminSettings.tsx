import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiListShipments } from '@/lib/adminApi';
import { Link } from 'react-router-dom';

export default function AdminSettings() {
  const [username] = useState(() => localStorage.getItem('adminUsername') || '');
  const [dbOk, setDbOk] = useState<'checking' | 'ok' | 'fail'>('checking');
  const [dbMessage, setDbMessage] = useState('');

  useEffect(() => {
    apiListShipments()
      .then(() => {
        setDbOk('ok');
        setDbMessage('Neon / DATABASE_URL is reachable with this session.');
      })
      .catch((err: any) => {
        setDbOk('fail');
        setDbMessage(err.message || 'Could not reach the database.');
      });
  }, []);

  return (
    <div className="max-w-xl space-y-6">
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h1 className="text-xl font-semibold">Admin settings</h1>
        <p className="text-sm text-gray-600">
          Staff login uses <code className="text-xs bg-gray-100 px-1 rounded">ADMIN_USERNAME</code> and{' '}
          <code className="text-xs bg-gray-100 px-1 rounded">ADMIN_PASSWORD</code> on Vercel. Change those env vars and redeploy to rotate the password.
        </p>
        <div>
          <label className="text-sm font-medium">Signed-in staff username</label>
          <Input value={username} readOnly className="mt-1" />
        </div>
        <div className={`rounded-lg border p-4 text-sm ${
          dbOk === 'ok' ? 'bg-green-50 border-green-200 text-green-900'
            : dbOk === 'fail' ? 'bg-red-50 border-red-200 text-red-900'
            : 'bg-gray-50 border-gray-200 text-gray-700'
        }`}>
          <p className="font-medium">Database connection</p>
          <p className="mt-1">{dbOk === 'checking' ? 'Checking…' : dbMessage}</p>
        </div>
        <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
          <li>Optional: FEDEX_CLIENT_ID / FEDEX_CLIENT_SECRET for live FedEx Track API</li>
          <li>Public site: <Link className="text-[#007AB8]" to="/">homepage</Link> · <Link className="text-[#007AB8]" to="/tracking">tracking</Link></li>
        </ul>
        <Button
          type="button"
          variant="outline"
          className="text-gray-900 border-gray-300"
          onClick={() => {
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('adminPassword');
            localStorage.removeItem('adminUsername');
            toast.success('Signed out');
            window.location.href = '/admin';
          }}
        >
          Sign out this session
        </Button>
      </div>
    </div>
  );
}
