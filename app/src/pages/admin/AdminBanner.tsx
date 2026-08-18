import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { apiGetBanner, apiSaveBanner } from '@/lib/adminApi';

export default function AdminBanner() {
  const [form, setForm] = useState({ enabled: true, message: '', linkText: '', linkHref: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetBanner()
      .then(setForm)
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiSaveBanner(form);
      toast.success('Homepage banner saved to Neon');
    } catch (err: any) {
      toast.error(err.message || 'Save failed');
    }
  };

  if (loading) return <p className="text-sm text-gray-500">Loading banner…</p>;

  return (
    <div className="max-w-xl bg-white rounded-lg border p-6">
      <h1 className="text-xl font-semibold mb-4">Homepage alert banner</h1>
      <form onSubmit={save} className="space-y-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} />
          Show banner on homepage
        </label>
        <div>
          <label className="text-sm font-medium">Message</label>
          <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Link text</label>
          <Input value={form.linkText} onChange={(e) => setForm({ ...form, linkText: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium">Link URL</label>
          <Input value={form.linkHref} onChange={(e) => setForm({ ...form, linkHref: e.target.value })} />
        </div>
        <Button type="submit" className="bg-[#4D148C] text-white">Save banner</Button>
      </form>
    </div>
  );
}
