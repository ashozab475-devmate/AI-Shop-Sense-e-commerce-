'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, RefreshCw, CheckCircle, DollarSign, Tag, Clock, Info } from 'lucide-react';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import toast from 'react-hot-toast';

const CONDITIONS = [
  { value: 'like_new', label: 'Like New',  desc: 'Barely used, no visible wear',        color: 'from-green-500 to-emerald-600',  mult: '85%' },
  { value: 'good',     label: 'Good',      desc: 'Minor signs of use, fully functional', color: 'from-blue-500 to-cyan-600',      mult: '65%' },
  { value: 'fair',     label: 'Fair',      desc: 'Noticeable wear but works fine',       color: 'from-yellow-500 to-orange-500',  mult: '45%' },
  { value: 'poor',     label: 'Poor',      desc: 'Heavy wear or minor defects',          color: 'from-red-500 to-rose-600',       mult: '25%' },
];

const CATEGORIES = ['Smart Home', 'Wellness', 'Workspace', 'Audio', 'Outdoors', 'Beauty', 'Grocery', 'Other'];

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

export default function TradePage() {
  const router = useRouter();
  const [mounted, setMounted]           = useState(false);
  const [isLoggedIn, setIsLoggedIn]     = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ productName: '', category: '', condition: '', ageYears: 1, description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [valuation, setValuation] = useState(null);
  const [estimating, setEstimating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
  }, []);

  useEffect(() => {
    if (activeTab === 'history') fetchMyRequests();
  }, [activeTab]);

  const fetchMyRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setLoadingRequests(true);
    const res = await fetch('/api/trade/my-requests', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) { const d = await res.json(); setMyRequests(d.trades || []); }
    setLoadingRequests(false);
  };

  const getEstimate = async () => {
    if (!form.productName || !form.category || !form.condition) {
      toast.error('Please fill in product name, category and condition'); return;
    }
    setEstimating(true);
    const res = await fetch('/api/trade/estimate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) { setValuation(data); setStep(3); }
    else toast.error(data.error || 'Failed to estimate');
    setEstimating(false);
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please sign in to submit a trade'); router.push('/sign_in?redirect=/trade'); return; }
    setSubmitting(true);

    // Upload image if provided
    let imageUrl = null;
    if (imageFile) {
      const reader = new FileReader();
      imageUrl = await new Promise(resolve => {
        reader.onload = e => resolve(e.target.result);
        reader.readAsDataURL(imageFile);
      });
    }

    const res = await fetch('/api/trade/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...form, imageUrl }),
    });
    const data = await res.json();
    if (res.ok) { setSubmitted(true); toast.success('Trade request submitted!'); }
    else toast.error(data.error || 'Failed to submit');
    setSubmitting(false);
  };

  const reset = () => {
    setStep(1); setForm({ productName: '', category: '', condition: '', ageYears: 1, description: '' });
    setValuation(null); setSubmitted(false); setImageFile(null); setImagePreview(null);
  };

  // Show login prompt if not authenticated
  if (mounted && !isLoggedIn) return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f192f] via-[#101c34] to-[#0c1527] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="bg-[#1a2333] border border-white/10 rounded-3xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-amber-500/30">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-2">Sign In Required</h2>
          <p className="text-slate-400 text-sm mb-8">
            You need to be logged in to submit a trade-in request and view your trade history.
          </p>
          <Link
            href="/sign_in?redirect=/trade"
            className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-full transition-all hover:scale-105 shadow-lg shadow-amber-500/25"
          >
            Sign In to Continue
          </Link>
          <p className="mt-4 text-xs text-slate-500">
            Don't have an account?{' '}
            <Link href="/sign_up" className="text-amber-400 hover:underline font-medium">Sign Up</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-3xl mx-auto w-full px-4 pt-28 pb-12">
        <Link href="/shopping" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition text-sm">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Shopping
        </Link>

        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4 shadow-lg shadow-amber-500/30">
            <RefreshCw className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2">Trade-In</h1>
          <p className="text-gray-500">Get store credit for your used products instantly</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
          {[['new', 'New Trade'], ['history', 'My Requests']].map(([val, label]) => (
            <button key={val} onClick={() => setActiveTab(val)}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${activeTab === val ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900'}`}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'history' ? (
          <div>
            {loadingRequests ? (
              <div className="text-center py-12"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-amber-500 mx-auto"></div></div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-16 border border-gray-200 rounded-2xl bg-white">
                <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No trade requests yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myRequests.map(t => (
                  <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex gap-3 items-start">
                        {t.imageUrl && (
                          <img src={t.imageUrl} alt={t.productName} className="w-14 h-14 rounded-lg object-cover border border-gray-200 flex-shrink-0" />
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{t.productName}</p>
                          <p className="text-sm text-gray-500">{t.category} · {t.condition.replace('_', ' ')} · {t.ageYears}yr old</p>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${STATUS_COLORS[t.status]}`}>{t.status}</span>
                    </div>
                    <div className="flex gap-6 text-sm">
                      <div><p className="text-gray-400 text-xs">Estimated Value</p><p className="font-bold text-gray-900">${t.estimatedValue.toFixed(2)}</p></div>
                      <div><p className="text-gray-400 text-xs">Offered Value</p><p className="font-bold text-amber-600">${t.offeredValue.toFixed(2)}</p></div>
                    </div>
                    {t.adminNotes && <p className="text-xs text-blue-600 mt-2 bg-blue-50 px-3 py-1.5 rounded-lg">Admin: {t.adminNotes}</p>}
                    {t.status === 'approved' && <p className="text-xs text-green-600 mt-2 bg-green-50 px-3 py-1.5 rounded-lg">✓ ${t.offeredValue.toFixed(2)} store credit added to your wallet</p>}
                    <p className="text-xs text-gray-400 mt-2">{new Date(t.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : submitted ? (
          <div className="text-center py-16 border border-gray-200 rounded-2xl bg-white shadow-sm">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-500 mb-2">We'll review your trade request and get back to you.</p>
            <p className="text-amber-600 font-bold text-xl mb-6">Offered: ${valuation?.offeredValue?.toFixed(2)}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={reset} className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold">New Trade</button>
              <button onClick={() => setActiveTab('history')} className="px-6 py-2.5 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition">View Requests</button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map(s => (
                <div key={s} className="flex items-center gap-2 flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white' : 'bg-gray-200 text-gray-400'}`}>{s}</div>
                  {s < 3 && <div className={`flex-1 h-0.5 transition-all ${step > s ? 'bg-amber-500' : 'bg-gray-200'}`}></div>}
                </div>
              ))}
            </div>

            {/* Step 1 — Product Details */}
            {step === 1 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Tag className="w-5 h-5 text-amber-500" /> Product Details</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name</label>
                  <input type="text" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
                    placeholder="e.g. SilentZone ANC Headphones"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white">
                    <option value="">-- Select category --</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description (optional)</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={2} placeholder="Any additional details about the product..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-400 bg-white" />
                </div>
                {/* Image Upload — mandatory */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Product Photo <span className="text-red-500">*</span>
                    <span className="text-xs font-normal text-gray-400 ml-1">(required)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-20 h-20 rounded-xl object-cover border border-gray-200" />
                    )}
                    <label className={`flex-1 flex flex-col items-center justify-center h-20 border-2 border-dashed rounded-xl cursor-pointer transition-all ${imagePreview ? 'border-amber-400 bg-amber-50' : 'border-gray-300 hover:border-amber-400 hover:bg-amber-50'}`}>
                      <span className="text-xs text-gray-500">{imagePreview ? '✓ Photo uploaded — click to change' : 'Click to upload product photo'}</span>
                      <input type="file" accept="image/*" className="hidden"
                        onChange={e => {
                          const f = e.target.files[0];
                          if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); }
                        }} />
                    </label>
                  </div>
                </div>
                <button onClick={() => {
                  if (!form.productName || !form.category) { toast.error('Fill in product name and category'); return; }
                  if (!imageFile) { toast.error('Please upload a photo of your product'); return; }
                  setStep(2);
                }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:opacity-90 transition">
                  Next: Condition & Age →
                </button>
              </div>
            )}

            {/* Step 2 — Condition & Age */}
            {step === 2 && (
              <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-6 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Clock className="w-5 h-5 text-amber-500" /> Condition & Age</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Condition</label>
                  <div className="grid grid-cols-2 gap-3">
                    {CONDITIONS.map(c => (
                      <button key={c.value} onClick={() => setForm(f => ({ ...f, condition: c.value }))}
                        className={`p-4 rounded-xl border text-left transition ${form.condition === c.value ? `bg-gradient-to-br ${c.color} border-transparent text-white` : 'border-gray-200 hover:border-amber-300 bg-white text-gray-700'}`}>
                        <p className="font-semibold text-sm">{c.label} <span className="text-xs opacity-70">({c.mult} value)</span></p>
                        <p className="text-xs opacity-70 mt-1">{c.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Age: <span className="text-amber-600 font-bold">{form.ageYears} year{form.ageYears !== 1 ? 's' : ''}</span></label>
                  <input type="range" min={0} max={10} step={0.5} value={form.ageYears}
                    onChange={e => setForm(f => ({ ...f, ageYears: parseFloat(e.target.value) }))}
                    className="w-full accent-amber-500" />
                  <div className="flex justify-between text-xs text-gray-400 mt-1"><span>Brand new</span><span>10+ years</span></div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition">← Back</button>
                  <button onClick={getEstimate} disabled={estimating || !form.condition}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">
                    {estimating ? 'Calculating...' : 'Get Valuation →'}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3 — Valuation Result */}
            {step === 3 && valuation && (
              <div className="space-y-4">
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 text-center">
                  <DollarSign className="w-10 h-10 text-amber-500 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm mb-1">We'll offer you</p>
                  <p className="text-5xl font-black text-amber-600 mb-1">${valuation.offeredValue.toFixed(2)}</p>
                  <p className="text-gray-500 text-sm">Estimated market value: <span className="text-gray-900 font-semibold">${valuation.estimatedValue.toFixed(2)}</span></p>
                  <p className="text-xs text-amber-600 mt-2 font-semibold">💳 Credited as store wallet balance on approval</p>
                </div>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                  <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm text-gray-700"><Info className="w-4 h-4 text-amber-500" /> How we calculated this</h3>
                  <div className="space-y-2">
                    {Object.values(valuation.breakdown).map((line, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs flex-shrink-0 mt-0.5 font-bold">{i + 1}</span>
                        <span className="text-gray-600">{line}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(2)} className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition">← Adjust</button>
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-semibold hover:opacity-90 transition disabled:opacity-50">
                    {submitting ? 'Submitting...' : 'Accept Offer'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

