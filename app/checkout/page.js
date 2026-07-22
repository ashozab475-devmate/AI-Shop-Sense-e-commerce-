'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/app/context/CartContext';
import Navbar from '@/app/components/Navbar';
import Footer from '@/app/components/Footer';
import { ArrowLeft, ShoppingBag, CreditCard, MapPin, User, Mail, Phone, Lock, Truck, ShieldCheck, CheckCircle } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY);

const CARD_STYLE = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1a1a1a',
      fontFamily: 'inherit',
      '::placeholder': { color: '#9ca3af' },
    },
    invalid: { color: '#ef4444' },
  },
};

function CheckoutForm({ cartItems, totalAmount, onSuccess }) {
  const stripe   = useStripe();
  const elements = useElements();
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [step, setStep]         = useState(1); // 1=shipping, 2=payment
  const [address, setAddress]   = useState({
    fullName: '', email: '', phone: '',
    address: '', city: '', state: '', zipCode: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setAddress(prev => ({ ...prev, [name]: value }));
  };

  const shippingFilled = address.fullName && address.email && address.phone &&
                         address.address && address.city && address.state && address.zipCode;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please sign in to complete your purchase.');
        setLoading(false);
        return;
      }

      const intentRes = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ shippingAddress: address }),
      });
      const { clientSecret, paymentIntentId } = await intentRes.json();

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: { name: address.fullName, email: address.email },
        },
      });

      if (stripeError) { setError(stripeError.message); setLoading(false); return; }

      const confirmRes = await fetch('/api/checkout/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ paymentIntentId, shippingAddress: address }),
      });
      const { orderId } = await confirmRes.json();
      onSuccess(orderId);
    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const InputField = ({ icon: Icon, name, type = 'text', placeholder, colSpan = '' }) => (
    <div className={`relative ${colSpan}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="w-4 h-4 text-gray-400" />
      </div>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        value={address[name]}
        onChange={handleChange}
        required
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white transition-all"
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-5">

      {/* ── Step 1: Shipping ─────────────────────────────────────────── */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step >= 1 ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-violet-600" /> Shipping Address
          </h3>
          {step > 1 && shippingFilled && (
            <button type="button" onClick={() => setStep(1)}
              className="ml-auto text-xs text-violet-600 hover:text-violet-700 font-semibold">Edit</button>
          )}
        </div>

        {step === 1 ? (
          <div className="p-6 space-y-3">
            <InputField icon={User}  name="fullName" placeholder="Full Name"    colSpan="col-span-2" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InputField icon={Mail}  name="email"   type="email" placeholder="Email Address" />
              <InputField icon={Phone} name="phone"   type="tel"   placeholder="Phone Number" />
            </div>
            <InputField icon={MapPin} name="address"  placeholder="Street Address" colSpan="col-span-2" />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <input name="city" placeholder="City" value={address.city} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white" />
              </div>
              <div className="col-span-1">
                <input name="state" placeholder="State" value={address.state} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white" />
              </div>
              <div className="col-span-1">
                <input name="zipCode" placeholder="ZIP" value={address.zipCode} onChange={handleChange} required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 bg-white" />
              </div>
            </div>
            <button type="button" onClick={() => shippingFilled && setStep(2)}
              disabled={!shippingFilled}
              className="w-full py-3 bg-gray-900 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all mt-2">
              Continue to Payment →
            </button>
          </div>
        ) : (
          <div className="px-6 py-4 text-sm text-gray-600">
            <p className="font-semibold text-gray-900">{address.fullName}</p>
            <p>{address.address}, {address.city}, {address.state} {address.zipCode}</p>
            <p>{address.email} · {address.phone}</p>
          </div>
        )}
      </div>

      {/* ── Step 2: Payment ──────────────────────────────────────────── */}
      <div className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all ${step === 2 ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${step >= 2 ? 'bg-violet-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-violet-600" /> Payment Details
          </h3>
        </div>

        {step === 2 && (
          <div className="p-6 space-y-4">
            <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 focus-within:border-violet-400 focus-within:bg-white transition-all">
              <CardElement options={CARD_STYLE} />
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Lock className="w-3.5 h-3.5" />
              <span>Your payment is secured with 256-bit SSL encryption</span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading || !stripe}
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-base rounded-xl transition-all hover:scale-[1.01] shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  Pay ${totalAmount.toFixed(2)}
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-4 text-xs text-gray-400 pt-2">
        <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-green-500" /> Secure Checkout</span>
        <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5 text-blue-500" /> Free Shipping over $100</span>
        <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-violet-500" /> 30-Day Returns</span>
      </div>
    </form>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, loading } = useCart();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted || loading) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-4">
          <ShoppingBag className="w-16 h-16 text-gray-300" />
          <p className="text-xl font-bold text-gray-900">Your cart is empty</p>
          <p className="text-gray-500 text-sm">Add some products before checking out.</p>
          <Link href="/shopping"
            className="px-7 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-all">
            Browse Products
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price || item.currentPrice || item.basePrice || 0) * item.quantity, 0);
  const tax      = subtotal * 0.08;
  const shipping = subtotal > 100 ? 0 : 12.99;
  const total    = subtotal + tax + shipping;

  const handleSuccess = (orderId) => {
    router.push(`/checkout/success?orderId=${orderId}`);
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] flex flex-col">
      <Navbar />

      <main className="flex-1 pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="mb-8">
            <Link href="/cart"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Cart
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Checkout</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

            {/* ── Left: Form ─────────────────────────────────────────── */}
            <div className="lg:col-span-3">
              <Elements stripe={stripePromise}>
                <CheckoutForm cartItems={cartItems} totalAmount={total} onSuccess={handleSuccess} />
              </Elements>
            </div>

            {/* ── Right: Order Summary ────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm sticky top-24">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 rounded-t-2xl">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-violet-600" />
                    Order Summary
                    <span className="ml-auto text-xs text-gray-400 font-normal">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</span>
                  </h3>
                </div>

                {/* Items */}
                <div className="px-6 py-4 space-y-3 max-h-64 overflow-y-auto">
                  {cartItems.map(item => (
                    <div key={item.id} className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                        <img
                          src={item.imageUrl || item.image || item.product?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'}
                          alt={item.name || item.product?.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200&q=80'; }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{item.name || item.product?.name}</p>
                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                        ${((item.price || item.currentPrice || item.basePrice || 0) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="px-6 py-4 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Tax (8%)</span>
                    <span className="font-semibold text-gray-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Shipping</span>
                    <span className="font-semibold">
                      {shipping === 0
                        ? <span className="text-green-600 font-bold">FREE</span>
                        : <span className="text-gray-900">${shipping.toFixed(2)}</span>}
                    </span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                    <span className="font-black text-gray-900">Total</span>
                    <span className="text-xl font-black text-violet-600">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
