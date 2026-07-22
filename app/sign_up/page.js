'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, Phone, Sparkles } from 'lucide-react';

export default function SignUp() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';

    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email address';

    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    else if (!/^[0-9+\-\s()]+$/.test(formData.phone))
      newErrors.phone = 'Please enter a valid phone number';

    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])/.test(formData.password))
      newErrors.password = 'Password must contain at least one uppercase and one lowercase letter';

    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
        }),
      });

      let data;
      const responseText = await response.text();

      try {
        data = JSON.parse(responseText);
      } catch {
        data = null;
      }

      if (response.ok) {
        alert('Account created successfully! Redirecting to sign in...');
        window.location.href = '/sign_in';
        return;
      }

      if (data?.error) {
        if (data.error.includes('already exists')) {
          setErrors((prev) => ({ ...prev, email: data.error }));
          return;
        }
        alert(data.error);
        return;
      }

      alert('Server validation failed.');
    } catch (error) {
      console.error('Sign up error:', error);
      alert('Failed to connect to the server. Please check your internet connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f0e8] text-gray-900 flex items-center justify-center px-4 py-10 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-28 -right-24 h-64 w-64 rounded-full bg-[#e8380d]/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-72 w-72 rounded-full bg-black/5 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-6 text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111111] shadow-sm transition-transform group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-[#e8380d]" />
            </div>
            <span className="text-2xl font-black tracking-tight">
              Shop<span className="text-[#e8380d]">Sense</span>
            </span>
          </Link>
        </div>

        <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-xl backdrop-blur sm:p-8">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8380d] shadow-sm transition-transform hover:scale-105">
              <Sparkles className="h-8 w-8 text-white" />
            </div>

            <h1 className="text-4xl font-black tracking-tight text-gray-900">Create Account</h1>
            <p className="mt-2 text-sm text-gray-500">Join us today! Start your journey with us.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <User className={`h-5 w-5 transition-colors ${errors.name ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#e8380d]'}`} />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`block w-full rounded-2xl border bg-white px-12 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition-colors focus:border-[#e8380d] focus:ring-4 focus:ring-[#e8380d]/15 ${
                    errors.name ? 'border-red-300' : 'border-black/10'
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

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
              <label htmlFor="phone" className="block text-sm font-semibold text-gray-700">
                Phone Number
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Phone className={`h-5 w-5 transition-colors ${errors.phone ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#e8380d]'}`} />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className={`block w-full rounded-2xl border bg-white px-12 py-3.5 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition-colors focus:border-[#e8380d] focus:ring-4 focus:ring-[#e8380d]/15 ${
                    errors.phone ? 'border-red-300' : 'border-black/10'
                  }`}
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className={`h-5 w-5 transition-colors ${errors.password ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#e8380d]'}`} />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`block w-full rounded-2xl border bg-white px-12 py-3.5 pr-12 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition-colors focus:border-[#e8380d] focus:ring-4 focus:ring-[#e8380d]/15 ${
                    errors.password ? 'border-red-300' : 'border-black/10'
                  }`}
                  placeholder="Create a password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
              <p className="text-xs text-gray-500">Must contain uppercase and lowercase letters.</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock className={`h-5 w-5 transition-colors ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400 group-focus-within:text-[#e8380d]'}`} />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`block w-full rounded-2xl border bg-white px-12 py-3.5 pr-12 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition-colors focus:border-[#e8380d] focus:ring-4 focus:ring-[#e8380d]/15 ${
                    errors.confirmPassword ? 'border-red-300' : 'border-black/10'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-700 transition-colors"
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center rounded-full bg-[#111111] py-3.5 px-4 text-base font-bold text-white transition-all hover:bg-black hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <div className="pt-2">
              <div className="relative flex justify-center text-sm">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-black/10" />
                </div>
                <span className="relative bg-[#f5f0e8] px-4 text-gray-500 font-medium">Already have an account?</span>
              </div>
            </div>

            <p className="text-center text-sm">
              <Link
                href="/sign_in"
                className="inline-flex items-center font-semibold text-[#111111] hover:text-black transition-colors"
              >
                Sign in to your account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
