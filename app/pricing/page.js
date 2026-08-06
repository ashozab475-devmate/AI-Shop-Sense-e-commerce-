'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  TrendingUp, TrendingDown, Package, AlertCircle,
  RefreshCw, Lock, Edit2, Save, X, DollarSign, Settings, History, ChevronDown
} from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import toast from 'react-hot-toast';

export default function PricingPage() {
  const router = useRouter();
  const [analytics, setAnalytics]     = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [config, setConfig]           = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [error, setError]             = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [editingId, setEditingId]     = useState(null);
  const [editPrice, setEditPrice]     = useState('');
  const [savingId, setSavingId]       = useState(null);
  const [activeTab, setActiveTab]     = useState('analytics'); // 'analytics' | 'config'
  const [configForm, setConfigForm]   = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [mounted, setMounted]           = useState(false);

  const getToken = () => typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    fetchAll(token);
  }, []);

  const fetchAll = async (token) => {
    setLoading(true);
    setError('');
    try {
      const [analyticsRes, configRes] = await Promise.all([
        fetch('/api/pricing/analytics', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/pricing/config',    { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (analyticsRes.status === 401) { router.push('/signin'); return; }
      if (analyticsRes.status === 403) { setError('Admin access required'); setLoading(false); return; }
      if (!analyticsRes.ok) throw new Error('Failed to fetch analytics');

      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData);
      setLastUpdated(new Date().toLocaleTimeString());

      // Fetch all products for manual pricing tab
      const productsRes = await fetch('/api/products', { headers: { Authorization: `Bearer ${token}` } });
      if (productsRes.ok) {
        const pd = await productsRes.json();
        setAllProducts(pd.products || pd || []);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        const cfg = configData.data || configData;
        setConfig(cfg);
        setConfigForm(cfg);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const fetchAnalytics = async (isRefresh = false) => {
    const token = getToken();
    if (!token) return;
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pricing/analytics', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalytics(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const fetchPriceHistory = async (product) => {
    const token = getToken();
    setHistoryProduct(product);
    try {
      const res = await fetch(`/api/pricing/history/${product.id}?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPriceHistory(data.history || []);
      }
    } catch { setPriceHistory([]); }
  };

  const handleSavePrice = async (productId) => {
    const price = parseFloat(editPrice);
    if (isNaN(price) || price <= 0) { toast.error('Enter a valid price'); return; }
    setSavingId(productId);
    const token = getToken();
    try {
      const res = await fetch(`/api/pricing/update/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newPrice: price, reason: 'manual' }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Price updated successfully');
        setEditingId(null);
        setEditPrice('');
        fetchAll(getToken());
      } else {
        toast.error(data.error || 'Failed to update price');
      }
    } catch { toast.error('Error updating price'); }
    finally { setSavingId(null); }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    const token = getToken();
    try {
      const res = await fetch('/api/pricing/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(configForm),
      });
      const data = await res.json();
      if (res.ok) {
        setConfig(data.data || data);
        toast.success('Pricing config saved');
      } else {
        toast.error(data.error || 'Failed to save config');
      }
    } catch { toast.error('Error saving config'); }
    finally { setSavingConfig(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pricing analytics...</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  // Not logged in — show admin login prompt
  if (mounted && !loading && !analytics && !error) return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Lock className="w-8 h-8 text-violet-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Admin Access Required</h2>
          <p className="text-gray-500 text-sm mb-8">
            The Dynamic Pricing dashboard is restricted to administrators only.
            Please log in with your admin credentials to continue.
          </p>
          <a
            href="/sign_in?role=admin&redirect=/pricing"
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-violet-500/25"
          >
            <Lock className="w-5 h-5" />
            Login as Admin
          </a>
          <p className="mt-4 text-xs text-gray-400">
            Not an admin?{' '}
            <a href="/shopping" className="text-violet-600 hover:underline font-medium">Go to Shopping</a>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <Navbar />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-28 pb-16">

        {/* Header */}
        <div className="mb-8 border-b border-gray-200 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center">
              <Lock className="w-5 h-5 text-violet-600" />
            </div>
            <span className="px-3 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded-full">ADMIN ONLY</span>
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Dynamic Pricing</h1>
          <p className="text-gray-500 text-sm">Real-time analytics, manual price overrides, and pricing engine configuration</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white border border-gray-200 p-1 rounded-xl w-fit">
          {[['analytics', 'Analytics', TrendingUp], ['manual', 'Manual Pricing', DollarSign], ['config', 'Engine Config', Settings]].map(([val, label, Icon]) => (
            <button key={val} onClick={() => setActiveTab(val)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${activeTab === val ? 'bg-violet-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>

        {/* ── ANALYTICS TAB ── */}
        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Products',    value: analytics.totalProducts,                    icon: Package,     color: 'text-violet-600', bg: 'bg-violet-50' },
                { label: 'Avg Base Price',    value: `$${analytics.avgBasePrice?.toFixed(2)}`,   icon: TrendingUp,  color: 'text-green-600',  bg: 'bg-green-50' },
                { label: 'Avg Current Price', value: `$${analytics.avgCurrentPrice?.toFixed(2)}`,icon: TrendingDown,color: 'text-blue-600',   bg: 'bg-blue-50' },
                { label: 'Price Changes',     value: analytics.priceChanges,                     icon: TrendingUp,  color: 'text-orange-600', bg: 'bg-orange-50' },
              ].map(({ label, value, icon: Icon, color, bg }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-gray-500 text-sm">{label}</p>
                    <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                </div>
              ))}
            </div>

            {/* Top Demand */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" /> Top Demand Products
              </h2>
              <div className="space-y-3">
                {analytics.topDemandProducts?.map((p, idx) => (
                  <div key={p.id} className="flex items-center justify-between p-4 bg-[#f5f0e8] rounded-xl border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">{idx + 1}</div>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-500">👁 {p.viewCount || 0} views</span>
                          <span className="text-xs text-gray-500">🛒 {p.cartAddCount || 0} cart</span>
                          <span className="text-xs text-gray-500">✅ {p.demandCount || 0} purchases</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${p.currentPrice?.toFixed(2)}</p>
                      <p className="text-xs text-gray-400">Base: ${p.basePrice?.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Stock */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-500" /> Low Stock Products
              </h2>
              {analytics.lowStockProducts?.length > 0 ? (
                <div className="space-y-3">
                  {analytics.lowStockProducts.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-[#f5f0e8] rounded-xl border border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-xs">{idx + 1}</div>
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                          <div className="w-28 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                            <div className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                              style={{ width: `${(p.stock / p.maxStock) * 100}%` }} />
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">${p.currentPrice?.toFixed(2)}</p>
                        <p className="text-xs text-gray-400">{p.stock}/{p.maxStock} in stock</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8 text-sm">All products have healthy stock levels</p>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              {lastUpdated && <p className="text-gray-400 text-xs">Last updated: {lastUpdated}</p>}
              <button onClick={() => fetchAnalytics(true)} disabled={refreshing}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-lg transition text-sm">
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Analytics'}
              </button>
            </div>

            {/* Demand Metrics Table */}
            {analytics.demandMetrics && analytics.demandMetrics.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-600" /> Demand Metrics
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Real-time user behaviour — use this to decide manual price adjustments.
                    High demand = consider raising price. Low demand + high views = consider lowering price.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Product</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">👁 Views</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">🛒 Cart Adds</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">✅ Purchases</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Current Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Suggestion</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Suggested Price</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.demandMetrics.map(m => {
                        // Suggestion logic
                        const suggestion =
                          m.purchaseCount >= 5
                            ? { text: '▲ Raise price (+10%)',   color: 'text-green-600 bg-green-50',  mult: 1.10, reason: 'demand_high' }
                          : m.viewCount >= 10 && m.purchaseCount === 0
                            ? { text: '▼ Lower price (-10%)',   color: 'text-red-500 bg-red-50',      mult: 0.90, reason: 'demand_low' }
                          : m.cartAddCount >= 3
                            ? { text: '▲ Slight raise (+5%)',   color: 'text-blue-600 bg-blue-50',   mult: 1.05, reason: 'cart_interest' }
                            : { text: '— Hold (no change)',     color: 'text-gray-400 bg-gray-50',   mult: null, reason: null };

                        const suggestedPrice = suggestion.mult
                          ? Math.round(m.currentPrice * suggestion.mult * 100) / 100
                          : null;

                        return (
                          <tr key={m.id} className="border-b hover:bg-gray-50 transition">
                            <td className="px-4 py-3">
                              <p className="font-semibold text-gray-900 text-xs">{m.name}</p>
                              <p className="text-gray-400 text-[10px]">{m.category}</p>
                            </td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-700">{m.viewCount}</td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-700">{m.cartAddCount}</td>
                            <td className="px-4 py-3 text-center font-semibold text-gray-700">{m.purchaseCount}</td>
                            <td className="px-4 py-3 font-bold text-gray-900">${m.currentPrice?.toFixed(2)}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${suggestion.color}`}>
                                {suggestion.text}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {suggestedPrice ? (
                                <span className={`font-bold text-sm ${suggestion.mult > 1 ? 'text-green-600' : 'text-red-500'}`}>
                                  ${suggestedPrice.toFixed(2)}
                                  <span className="text-xs font-normal text-gray-400 ml-1">
                                    ({suggestion.mult > 1 ? '+' : ''}{((suggestion.mult - 1) * 100).toFixed(0)}%)
                                  </span>
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              {suggestion.mult ? (
                                <button
                                  disabled={savingId === m.id}
                                  onClick={async () => {
                                    setSavingId(m.id);
                                    const token = getToken();
                                    try {
                                      const res = await fetch(`/api/pricing/update/${m.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({ newPrice: suggestedPrice, reason: suggestion.reason }),
                                      });
                                      if (res.ok) {
                                        toast.success(`${m.name} → $${suggestedPrice.toFixed(2)}`);
                                        fetchAll(token);
                                      } else {
                                        const d = await res.json();
                                        toast.error(d.error || 'Failed');
                                      }
                                    } catch { toast.error('Error applying suggestion'); }
                                    finally { setSavingId(null); }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                                    suggestion.mult > 1
                                      ? 'bg-green-600 hover:bg-green-700 text-white'
                                      : 'bg-red-500 hover:bg-red-600 text-white'
                                  }`}
                                >
                                  {savingId === m.id ? 'Applying…' : 'Apply'}
                                </button>
                              ) : (
                                <span className="text-gray-300 text-xs">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="p-4 bg-gray-50 border-t text-xs text-gray-500">
                  💡 <strong>How it works:</strong> Click <strong>Apply</strong> to instantly update the price based on the demand signal. The change is logged in Price History with the reason.
                </div>
              </div>
            )}

            {/* Price History */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <History className="w-5 h-5 text-violet-600" /> Price Change History
              </h2>
              <p className="text-sm text-gray-500 mb-4">Select a product to view its price history</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {allProducts.slice(0, 12).map(p => (
                  <button key={p.id}
                    onClick={() => fetchPriceHistory(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${historyProduct?.id === p.id ? 'bg-violet-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-violet-100 hover:text-violet-700'}`}>
                    {p.name.length > 20 ? p.name.slice(0, 20) + '…' : p.name}
                  </button>
                ))}
              </div>

              {historyProduct && (
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">{historyProduct.name}</p>
                  {priceHistory.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-6">No price changes recorded yet</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Date & Time</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Old Price</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">New Price</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Change</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {priceHistory.map((h, i) => {
                            const diff = h.newPrice - h.oldPrice;
                            const pct  = ((diff / h.oldPrice) * 100).toFixed(1);
                            return (
                              <tr key={i} className="border-b hover:bg-gray-50">
                                <td className="px-4 py-2 text-gray-600 text-xs">{new Date(h.timestamp).toLocaleString()}</td>
                                <td className="px-4 py-2 text-gray-700">${h.oldPrice.toFixed(2)}</td>
                                <td className="px-4 py-2 font-semibold text-gray-900">${h.newPrice.toFixed(2)}</td>
                                <td className="px-4 py-2">
                                  <span className={`font-semibold text-xs ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-500' : 'text-gray-400'}`}>
                                    {diff > 0 ? '▲' : diff < 0 ? '▼' : '—'} {Math.abs(pct)}%
                                  </span>
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${h.reason === 'manual' ? 'bg-blue-100 text-blue-700' : h.reason === 'auto_update' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {h.reason}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── MANUAL PRICING TAB ── */}
        {activeTab === 'manual' && analytics && (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-violet-600" /> Manual Price Override
              </h2>
              <p className="text-sm text-gray-500 mt-1">Set exact prices for any product. Overrides the dynamic pricing engine.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Product</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Base Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Current Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Set New Price</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(allProducts.length > 0 ? allProducts : (analytics?.topDemandProducts || []).concat(analytics?.lowStockProducts || []))
                    .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
                    .map(p => (
                    <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">${p.basePrice?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">${p.currentPrice?.toFixed(2)}</span>
                        {p.currentPrice !== p.basePrice && (
                          <span className={`ml-2 text-xs font-semibold ${p.currentPrice > p.basePrice ? 'text-green-600' : 'text-red-500'}`}>
                            {p.currentPrice > p.basePrice ? '▲' : '▼'}
                            {Math.abs(((p.currentPrice - p.basePrice) / p.basePrice) * 100).toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === p.id ? (
                          <input
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={editPrice}
                            onChange={e => setEditPrice(e.target.value)}
                            className="w-28 px-3 py-1.5 border border-violet-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                            placeholder="0.00"
                            autoFocus
                          />
                        ) : (
                          <span className="text-gray-400 text-sm italic">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingId === p.id ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSavePrice(p.id)}
                              disabled={savingId === p.id}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-semibold hover:bg-green-700 transition disabled:opacity-50"
                            >
                              <Save className="w-3 h-3" />
                              {savingId === p.id ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={() => { setEditingId(null); setEditPrice(''); }}
                              className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-300 transition"
                            >
                              <X className="w-3 h-3" /> Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setEditingId(p.id); setEditPrice(p.currentPrice?.toFixed(2) || ''); }}
                            className="flex items-center gap-1 px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg text-xs font-semibold hover:bg-violet-200 transition"
                          >
                            <Edit2 className="w-3 h-3" /> Edit Price
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── CONFIG TAB ── */}
        {activeTab === 'config' && configForm && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Settings className="w-5 h-5 text-violet-600" /> Pricing Engine Configuration
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                { key: 'stockWeight',          label: 'Stock Weight',            desc: 'Impact of stock level on price (0–1)',  step: 0.05, min: 0, max: 1 },
                { key: 'demandWeight',         label: 'Demand Weight',           desc: 'Impact of demand on price (0–1)',       step: 0.05, min: 0, max: 1 },
                { key: 'competitorWeight',     label: 'Competitor Weight',       desc: 'Impact of competitor prices (0–1)',     step: 0.05, min: 0, max: 1 },
                { key: 'maxIncreasePercent',   label: 'Max Increase %',          desc: 'Maximum price increase allowed',        step: 1,    min: 0, max: 200 },
                { key: 'maxDecreasePercent',   label: 'Max Decrease %',          desc: 'Maximum price decrease allowed',        step: 1,    min: 0, max: 100 },
                { key: 'minProfitMargin',      label: 'Min Profit Margin %',     desc: 'Minimum profit margin to maintain',     step: 1,    min: 0, max: 100 },
                { key: 'updateFrequencyHours', label: 'Update Frequency (hrs)',  desc: 'How often prices auto-update',          step: 1,    min: 1, max: 168 },
              ].map(({ key, label, desc, step, min, max }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{label}</label>
                  <p className="text-xs text-gray-400 mb-2">{desc}</p>
                  <input
                    type="number"
                    step={step}
                    min={min}
                    max={max}
                    value={configForm[key] ?? ''}
                    onChange={e => setConfigForm(f => ({ ...f, [key]: parseFloat(e.target.value) }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 flex gap-3">
              <button
                onClick={handleSaveConfig}
                disabled={savingConfig}
                className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-lg transition text-sm"
              >
                <Save className="w-4 h-4" />
                {savingConfig ? 'Saving...' : 'Save Configuration'}
              </button>
              <button
                onClick={() => setConfigForm(config)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition text-sm"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
