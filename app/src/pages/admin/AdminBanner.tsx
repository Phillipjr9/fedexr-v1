import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getBanner, saveBanner, type BannerConfig } from '@/lib/adminStore';

export default function AdminBanner() {
  const [form, setForm] = useState<BannerConfig>(getBanner());
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    saveBanner(form);
    toast.success('Homepage banner updated');
  };
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
