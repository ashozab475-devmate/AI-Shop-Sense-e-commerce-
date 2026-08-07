'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function SellerSettingsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({ storeName:'', storeDescription:'', email:'', phone:'', address:'', bankAccount:'', notifications:true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/sign_in'); return; }
    if (session?.user?.role !== 'seller' && session?.user?.role !== 'admin') { router.push('/'); return; }
    if (status === 'authenticated') {
      fetch('/api/seller/settings').then(r => r.json()).then(d => { if (d.settings) setSettings(d.settings); }).catch(console.error).finally(() => setLoading(false));
    }
  }, [status, session, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await fetch('/api/seller/settings', { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify(settings) });
      setMessage(res.ok ? 'Settings saved successfully!' : 'Error saving settings');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Error saving settings'); } finally { setSaving(false); }
  };

  if (status === 'loading' || loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading settings...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Store Settings</h1>
        {message && <div className={`mb-6 p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
          {[['storeName','text','Store Name'],['storeDescription','text','Store Description'],['email','email','Email'],['phone','tel','Phone'],['address','text','Address'],['bankAccount','text','Bank Account']].map(([name,type,label]) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
              <input type={type} name={name} value={settings[name]} onChange={handleChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div className="flex items-center">
            <input type="checkbox" name="notifications" checked={settings.notifications} onChange={handleChange} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
            <label className="ml-3 text-sm font-semibold text-gray-900">Receive email notifications for new orders</label>
          </div>
          <button type="submit" disabled={saving} className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SellerSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <SellerSettingsContent />
    </Suspense>
  );
}
