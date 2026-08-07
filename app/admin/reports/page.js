'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

function AdminReportsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');

  useEffect(() => {
    if (status === 'loading') return;
    if (status === 'unauthenticated') { router.push('/sign_in'); return; }
    if (session?.user?.role !== 'admin') { router.push('/'); return; }

    const fetchReports = async () => {
      try {
        const res = await fetch(`/api/admin/reports?type=${reportType}`);
        const data = await res.json();
        setReports(data);
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    if (status === 'authenticated') fetchReports();
  }, [status, session, router, reportType]);

  const handleExport = async (format) => {
    try {
      const res = await fetch(`/api/admin/reports/export?type=${reportType}&format=${format}`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `report-${reportType}.${format}`;
      a.click();
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">Loading reports...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold text-sm">Export CSV</button>
            <button onClick={() => handleExport('pdf')} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm">Export PDF</button>
          </div>
        </div>
        <div className="mb-8 flex gap-2 flex-wrap">
          {['sales', 'users', 'products', 'inventory'].map((type) => (
            <button key={type} onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${reportType === type ? 'bg-blue-600 text-white' : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'}`}>
              {type} Report
            </button>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 capitalize">{reportType} Report</h2>
          <p className="text-gray-600">Report data will appear here once connected to your database.</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><p>Loading...</p></div>}>
      <AdminReportsContent />
    </Suspense>
  );
}
