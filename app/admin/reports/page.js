'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign_in');
      return;
    }

    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

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

    if (status === 'authenticated') {
      fetchReports();
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-gray-600">Loading reports...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleExport('csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-semibold text-sm"
            >
              Export CSV
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 font-semibold text-sm"
            >
              Export PDF
            </button>
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="mb-8 flex gap-2 flex-wrap">
          {['sales', 'users', 'products', 'inventory'].map((type) => (
            <button
              key={type}
              onClick={() => setReportType(type)}
              className={`px-4 py-2 rounded-lg font-semibold capitalize ${
                reportType === type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type} Report
            </button>
          ))}
        </div>

        {/* Report Content */}
        <div className="bg-white rounded-lg shadow p-8">
          {reportType === 'sales' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Sales Report</h2>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">${reports?.sales?.total || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{reports?.sales?.orders || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">${reports?.sales?.avgOrder || 0}</p>
                </div>
              </div>
              <table className="w-full">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Date</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Orders</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-900">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {reports?.sales?.data?.map((row, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{row.date}</td>
                      <td className="px-4 py-2 text-gray-900">{row.orders}</td>
                      <td className="px-4 py-2 text-gray-900">${row.revenue}</td>
                    </tr>
                  )) || <tr><td colSpan="3" className="px-4 py-2 text-gray-600">No data available</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {reportType === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">User Report</h2>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{reports?.users?.total || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">New Users</p>
                  <p className="text-2xl font-bold text-gray-900">{reports?.users?.new || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{reports?.users?.active || 0}</p>
                </div>
              </div>
            </div>
          )}

          {reportType === 'products' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Product Report</h2>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{reports?.products?.total || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{reports?.products?.approved || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{reports?.products?.pending || 0}</p>
                </div>
              </div>
            </div>
          )}

          {reportType === 'inventory' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Inventory Report</h2>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Total Items</p>
                  <p className="text-2xl font-bold text-gray-900">{reports?.inventory?.total || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Low Stock</p>
                  <p className="text-2xl font-bold text-yellow-600">{reports?.inventory?.lowStock || 0}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm mb-1">Out of Stock</p>
                  <p className="text-2xl font-bold text-red-600">{reports?.inventory?.outOfStock || 0}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
