import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export default function AdminSettings() {
  const [username] = useState(() => localStorage.getItem('adminUsername') || '');
  const [note] = useState(
    'Staff login is controlled by ADMIN_USERNAME and ADMIN_PASSWORD on Vercel. Change those env vars and redeploy to rotate the real password. The value stored after sign-in is only used as the API secret for this browser session.'
  );

  return (
    <div className="max-w-xl bg-white rounded-lg border p-6 space-y-4">
      <h1 className="text-xl font-semibold">Admin settings</h1>
      <p className="text-sm text-gray-600">{note}</p>
      <div>
        <label className="text-sm font-medium">Signed-in staff username</label>
        <Input value={username} readOnly />
      </div>
      <Button
        type="button"
        variant="outline"
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
  );
}
