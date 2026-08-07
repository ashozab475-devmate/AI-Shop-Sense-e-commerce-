'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) { router.push('/sign_in'); return; }

    fetch(`/api/admin/reports?type=${reportType}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [router, reportType]);

  if (!mounted || loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><p className="text-gray-600">Loading reports...</p></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">Reports</h1>
        <div className="mb-8 flex gap-2 flex-wrap">
          {['sales','users','products','inventory'].map(type => (
            <button key={type} onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${reportType === type ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}>
              {type} Report
            </button>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 capitalize">{reportType} Report</h2>
          <p className="text-gray-500">Report data will display here once connected to your database.</p>
        </div>
      </div>
    </div>
  );
}
