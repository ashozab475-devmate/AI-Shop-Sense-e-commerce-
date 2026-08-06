'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Mail, Lock, Eye, EyeOff, LogIn, ShoppingBag, Store, ShieldCheck } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SignIn() {
  const [loginAs, setLoginAs] = useState('buyer');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pre-select admin tab if coming from pricing page
  useEffect(() => {
    if (searchParams.get('role') === 'admin') setLoginAs('admin');
  }, [searchParams]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const redirect = searchParams.get('redirect');
      const result = await signIn('google', {
        callbackUrl: redirect || '/shopping',
        redirect: true,
      });
      // If redirect:true, execution won't reach here on success.
      // On error, result?.error will be set.
      if (result?.error) {
        toast.error('Google sign-in failed. Please try again.');
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      toast.error('Google sign-in failed. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const isSeller = loginAs === 'seller';
  const isAdmin  = loginAs === 'admin';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, loginAs }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('token', data.token);
        toast.success('Login successful! Redirecting...');

        // Check redirect param first, then role-based redirect
        const redirect = searchParams.get('redirect');
        setTimeout(() => {
          if (redirect) {
            router.push(redirect);
          } else if (isAdmin) {
            router.push('/pricing');
          } else if (isSeller) {
            router.push('/seller');
          } else {
            router.push('/shopping');
          }
        }, 500);
      } else {
        toast.error(data.error || 'Login failed');
        setErrors((prev) => ({ ...prev, email: data.error || 'Login failed' }));
        setFormData((prev) => ({ ...prev, password: '' }));
      }
    } catch (error) {
      console.error('Sign in error:', error);
      toast.error('Failed to connect to the server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen bg-[#f5f0e8] text-gray-900 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-28 -right-24 h-64 w-64 rounded-full bg-[#e8380d]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-black/5 blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="mb-6 text-center">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111] shadow-sm transition-transform group-hover:scale-105">
                <ShoppingBag className="h-5 w-5 text-[#e8380d]" />
              </div>
              <span className="text-2xl font-black tracking-tight">
                Shop<span className="text-[#e8380d]">Sense</span>
              </span>
            </Link>
          </div>

          <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-xl backdrop-blur sm:p-8">
            <div className="mb-8 text-center">
              <div className="mb-4 flex items-center justify-center">
                <div
                  className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl shadow-sm transition-transform hover:scale-105 ${
                    isAdmin ? 'bg-violet-600' : isSeller ? 'bg-[#111111]' : 'bg-[#e8380d]'
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="h-8 w-8 text-white" /> : isSeller ? <Store className="h-8 w-8 text-white" /> : <LogIn className="h-8 w-8 text-white" />}
                </div>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-gray-900">
                Welcome Back
              </h1>
              <p className="mt-2 text-sm text-gray-500">
                Sign in to your {isAdmin ? 'admin' : isSeller ? 'seller' : 'buyer'} account
              </p>
            </div>

            {/* Only show role tabs when NOT coming from admin redirect */}
            {!isAdmin && (
            <div className="mb-8 grid grid-cols-3 rounded-full border border-black/10 bg-[#f5f0e8] p-1">
              <button
                type="button"
                onClick={() => setLoginAs('buyer')}
                className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-3 text-xs font-semibold transition-colors ${
                  !isSeller && !isAdmin
                    ? 'bg-[#111111] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Buyer
              </button>
              <button
                type="button"
                onClick={() => setLoginAs('seller')}
                className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-3 text-xs font-semibold transition-colors ${
                  isSeller
                    ? 'bg-[#e8380d] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Store className="h-3.5 w-3.5" />
                Seller
              </button>
              <button
                type="button"
                onClick={() => setLoginAs('admin')}
                className={`flex items-center justify-center gap-1.5 rounded-full px-3 py-3 text-xs font-semibold transition-colors ${
                  isAdmin
                    ? 'bg-violet-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                Admin
              </button>
            </div>
            )}

            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className={`h-5 w-5 transition-colors ${errors.email ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#e8380d]'}`} />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full rounded-2xl border bg-white px-12 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition-colors focus:border-[#e8380d] focus:ring-4 focus:ring-[#e8380d]/15 ${
                      errors.email ? 'border-red-300' : 'border-black/10'
                    }`}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                    Password
                  </label>
                  <Link href="#" className="text-sm font-medium text-[#e8380d] hover:underline">
                    Forgot password?
                  </Link>
                </div>

                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock className={`h-5 w-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full rounded-2xl border bg-white px-12 py-3.5 pr-12 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition-colors focus:border-[#e8380d] focus:ring-4 focus:ring-[#e8380d]/15 ${
                      errors.password ? 'border-red-300' : 'border-black/10'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition-colors hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-black/20 text-[#e8380d] focus:ring-[#e8380d]"
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm text-gray-600">
                  Remember me
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex w-full items-center justify-center rounded-full px-4 py-3.5 text-base font-bold text-white transition-all hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100 ${
                  isAdmin ? 'bg-violet-600 hover:bg-violet-700' : 'bg-[#111111] hover:bg-black'
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <svg className="mr-3 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  <>
                    {isAdmin ? <ShieldCheck className="mr-2 h-5 w-5" /> : isSeller ? <Store className="mr-2 h-5 w-5" /> : <LogIn className="mr-2 h-5 w-5" />}
                    Sign In as {isAdmin ? 'Admin' : isSeller ? 'Seller' : 'Buyer'}
                  </>
                )}
              </button>
            </form>

            {/* Google Sign In — only for Buyer and Seller, not Admin */}
            {!isAdmin && (
              <>
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex-1 h-px bg-black/10"></div>
                  <span className="text-xs text-gray-400 font-medium">OR</span>
                  <div className="flex-1 h-px bg-black/10"></div>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="mt-4 flex w-full items-center justify-center gap-3 rounded-full border border-black/10 bg-white px-4 py-3.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:scale-[1.01] hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
                >
                  {isGoogleLoading ? (
                    <svg className="h-5 w-5 animate-spin text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                  )}
                  {isGoogleLoading ? 'Redirecting to Google...' : 'Continue with Google'}
                </button>
              </>
            )}

            <p className="mt-6 text-center text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/sign_up" className="font-semibold text-[#e8380d] hover:underline">
                Sign up
              </Link>
            </p>
          </div>

          <p className="mx-auto mt-6 max-w-md text-center text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <Link href="#" className="font-medium text-gray-800 hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="#" className="font-medium text-gray-800 hover:underline">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
