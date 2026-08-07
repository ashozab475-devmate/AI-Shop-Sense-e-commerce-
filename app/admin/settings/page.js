'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function AdminSettingsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteName: 'ShopSense', siteEmail: 'support@shopsense.com',
    sitePhone: '+1 (555) 123-4567', maintenanceMode: false,
    emailNotifications: true, maxUploadSize: 10, currency: 'USD',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/sign_in'); return; }
    if (session?.user?.role !== 'admin') { router.push('/'); return; }

    const fetchSettings = async () => {
      try {
        const res = await fetch('/api/admin/settings');
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') fetchSettings();
  }, [status, session, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      setMessage(res.ok ? 'Settings saved successfully!' : 'Error saving settings');
      setTimeout(() => setMessage(''), 3000);
    } catch { setMessage('Error saving settings'); }
    finally { setSaving(false); }
  };

  if (status === 'loading' || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading settings...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">System Settings</h1>
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{message}</div>
        )}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8 space-y-6">
          {[['siteName','text','Site Name'],['siteEmail','email','Site Email'],['sitePhone','tel','Site Phone']].map(([name,type,label]) => (
            <div key={name}>
              <label className="block text-sm font-semibold text-gray-900 mb-2">{label}</label>
              <input type={type} name={name} value={settings[name]} onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Currency</label>
            <select name="currency" value={settings.currency} onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="USD">USD ($)</option><option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option><option value="CAD">CAD (C$)</option>
            </select>
          </div>
          <div className="space-y-3">
            {[['maintenanceMode','Enable Maintenance Mode'],['emailNotifications','Enable Email Notifications']].map(([name,label]) => (
              <div key={name} className="flex items-center">
                <input type="checkbox" name={name} checked={settings[name]} onChange={handleChange}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500" />
                <label className="ml-3 text-sm font-semibold text-gray-900">{label}</label>
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-semibold">
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <AdminSettingsContent />
    </Suspense>
  );
}
