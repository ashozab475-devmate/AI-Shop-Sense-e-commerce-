'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function NotificationsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/sign_in'); return; }
    if (status === 'authenticated') {
      fetch('/api/notifications').then(r => r.json()).then(d => setNotifications(d.notifications || [])).catch(console.error).finally(() => setLoading(false));
    }
  }, [status, router]);

  const handleMarkAsRead = async (id) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleDelete = async (id) => {
    await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter === 'order' || filter === 'promotion') return n.type === filter;
    return true;
  });

  if (status === 'loading' || loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading notifications...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Notifications</h1>
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all','unread','order','promotion'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${filter === f ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}>{f}</button>
          ))}
        </div>
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(n => (
              <div key={n.id} className={`p-4 rounded-lg border ${n.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{n.title}</h3>
                    <p className="text-gray-600 mt-1">{n.message}</p>
                    <div className="flex gap-4 mt-3 text-sm text-gray-500">
                      <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                      <span className="capitalize">{n.type}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!n.read && <button onClick={() => handleMarkAsRead(n.id)} className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Mark as read</button>}
                    <button onClick={() => handleDelete(n.id)} className="text-red-600 hover:text-red-800 text-sm font-semibold">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <div className="text-center py-12 bg-white rounded-lg"><p className="text-gray-600">No notifications found.</p></div>}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <NotificationsContent />
    </Suspense>
  );
}
