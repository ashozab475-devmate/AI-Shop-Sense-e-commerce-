'use client';

import { useEffect, useState } from 'react';
import { Star, Send } from 'lucide-react';
import toast from 'react-hot-toast';

function StarRating({ value, onChange }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange && onChange(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className="focus:outline-none"
        >
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= (hover || value) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ productId }) {
  const [reviews, setReviews] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ rating: 0, title: '', comment: '' });
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchReviews(); }, [productId]);

  const fetchReviews = async () => {
    const res = await fetch(`/api/reviews?productId=${productId}&limit=10`);
    if (res.ok) {
      const data = await res.json();
      setReviews(data.reviews || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.rating) { toast.error('Please select a rating'); return; }
    if (!form.title.trim()) { toast.error('Please enter a title'); return; }
    const token = localStorage.getItem('token');
    if (!token) { toast.error('Please sign in to leave a review'); return; }
    setSubmitting(true);
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ productId, ...form }),
    });
    const data = await res.json();
    if (res.ok) {
      toast.success('Review submitted');
      setReviews(prev => [data.review, ...prev]);
      setTotal(t => t + 1);
      setForm({ rating: 0, title: '', comment: '' });
      setShowForm(false);
    } else {
      toast.error(data.error || 'Failed to submit review');
    }
    setSubmitting(false);
  };

  const avgRating = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0;

  return (
    <div className="mt-16 border-t border-white/10 pt-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Customer Reviews</h2>
          <div className="flex items-center gap-3">
            <StarRating value={Math.round(avgRating)} />
            <span className="text-slate-400 text-sm">{avgRating.toFixed(1)} / 5 · {total} reviews</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-lg font-semibold text-sm hover:opacity-90 transition"
        >
          Write a Review
        </button>
      </div>

      {/* Review Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-white/10 rounded-xl p-6 mb-8 space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Your Rating</label>
            <StarRating value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Summarize your experience"
              className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-1">Comment (optional)</label>
            <textarea
              value={form.comment}
              onChange={e => setForm(f => ({ ...f, comment: e.target.value }))}
              rows={3}
              placeholder="Tell others about your experience..."
              className="w-full px-4 py-2 bg-slate-700 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
          >
            <Send className="w-4 h-4" /> {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="text-slate-400 text-center py-8">Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div className="text-slate-500 text-center py-8 border border-white/10 rounded-xl">
          No reviews yet. Be the first to review this product.
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(r => (
            <div key={r.id} className="bg-slate-800/40 border border-white/10 rounded-xl p-5">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-pink-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm">
                    {r.user?.name?.charAt(0) || 'U'}
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{r.user?.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <StarRating value={r.rating} />
              </div>
              <p className="font-semibold text-white mb-1">{r.title}</p>
              {r.comment && <p className="text-slate-400 text-sm">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
