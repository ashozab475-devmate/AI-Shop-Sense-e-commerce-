'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) { router.push('/sign_in'); return; }
    fetch('/api/notifications', { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.json()).then(d => setNotifications(d.notifications||[])).catch(console.error).finally(() => setLoading(false));
  }, [router]);

  const handleMarkAsRead = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/notifications/${id}`, { method:'PUT', headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'}, body: JSON.stringify({ read: true }) });
    setNotifications(notifications.map(n => n.id===id ? {...n, read:true} : n));
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem('token');
    await fetch(`/api/notifications/${id}`, { method:'DELETE', headers:{'Authorization':`Bearer ${token}`} });
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const filtered = notifications.filter(n => {
    if (filter==='unread') return !n.read;
    if (filter==='order'||filter==='promotion') return n.type===filter;
    return true;
  });

  if (!mounted || loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-600">Loading notifications...</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Notifications</h1>
        <div className="mb-6 flex gap-2 flex-wrap">
          {['all','unread','order','promotion'].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${filter===f?'bg-blue-600 text-white':'bg-white text-gray-900 border border-gray-300'}`}>{f}</button>
          ))}
        </div>
        {filtered.length > 0 ? (
          <div className="space-y-4">
            {filtered.map(n=>(
              <div key={n.id} className={`p-4 rounded-lg border ${n.read?'bg-white border-gray-200':'bg-blue-50 border-blue-200'}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{n.title}</h3>
                    <p className="text-gray-600 mt-1">{n.message}</p>
                    <p className="text-sm text-gray-500 mt-2">{new Date(n.createdAt).toLocaleDateString()} · {n.type}</p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    {!n.read && <button onClick={()=>handleMarkAsRead(n.id)} className="text-blue-600 text-sm font-semibold">Mark read</button>}
                    <button onClick={()=>handleDelete(n.id)} className="text-red-600 text-sm font-semibold">Delete</button>
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
