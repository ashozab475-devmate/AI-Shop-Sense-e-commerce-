'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../context/CartContext';

const NAV_GROUPS = [
  {
    label: 'Shop',
    items: [
      { href: '/shopping', label: 'All Products' },
      { href: '/shopping?category=Smart Home', label: 'Smart Home' },
      { href: '/shopping?category=Workspace', label: 'Workspace' },
      { href: '/shopping?category=Wellness', label: 'Wellness' },
      { href: '/shopping?category=Audio', label: 'Audio' },
    ],
  },
  {
    label: 'More',
    items: [
      { href: '/pricing', label: 'Pricing' },
      { href: '/trade', label: 'Trade In' },
      { href: '/about', label: 'About' },
    ],
  },
];

function DropdownMenu({ group }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-3 py-2 text-gray-900 hover:text-black font-medium text-sm transition-colors rounded-lg hover:bg-white/70"
      >
        {group.label}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-44 bg-white/95 backdrop-blur border border-black/10 rounded-xl shadow-lg py-1.5 z-50">
          {group.items.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-[#f5f0e8] hover:text-gray-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState('');
  const { getCartCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  const cartCount = mounted ? getCartCount() : 0;

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/shopping?search=${encodeURIComponent(query.trim())}`);
      setQuery('');
    }
  };

  return (
    <nav suppressHydrationWarning className="fixed top-0 left-0 right-0 z-50 bg-[#f5f0e8]/95 backdrop-blur border-b border-black/10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-3 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 group mr-2">
            <div className="w-8 h-8 bg-[#111111] rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4 text-[#e8380d]" />
            </div>
            <span className="text-xl font-black text-gray-900 tracking-tight">
              Shop<span className="text-[#e8380d]">Sense</span>
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="hidden lg:flex flex-1 max-w-xs sm:max-w-md">
            <div className="flex w-full items-center bg-white rounded-full px-4 py-2 gap-2 border border-black/10 focus-within:border-[#e8380d] focus-within:bg-white transition-all">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              <button
                type="submit"
                className="w-7 h-7 bg-[#e8380d] hover:bg-[#c42d0a] rounded-full flex items-center justify-center flex-shrink-0 transition-colors"
              >
                <Search className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </form>

          {/* Desktop nav links */}
          <div className="hidden lg:flex items-center gap-0.5 ml-2">
            <Link
              href="/"
              className="px-3 py-2 text-gray-700 hover:text-gray-900 font-medium text-sm rounded-lg hover:bg-white/70 transition-colors"
            >
              Home
            </Link>
            {NAV_GROUPS.map((group) => (
              <DropdownMenu key={group.label} group={group} />
            ))}
          </div>

          {/* Right side */}
          <div className="hidden lg:flex items-center gap-2 ml-auto flex-shrink-0">
            <Link
              href="/cart"
              className="relative p-2 text-gray-700 hover:text-gray-900 rounded-lg hover:bg-white/70 transition-colors"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span
                  suppressHydrationWarning
                  className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#e8380d] rounded-full text-[10px] flex items-center justify-center text-white font-bold"
                >
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/sign_up"
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 rounded-full hover:bg-white/70 transition-colors"
            >
              Sign up
            </Link>

            <Link
              href="/sign_in"
              className="px-4 py-2 text-sm font-bold text-white bg-[#111111] hover:bg-[#000000] rounded-full transition-all hover:scale-105 shadow-sm"
            >
              Log in
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden ml-auto p-2 text-gray-700 rounded-lg hover:bg-white/70 transition-colors"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden bg-[#f5f0e8]/98 backdrop-blur border-t border-black/10 shadow-lg">
          <div className="px-4 pt-3 pb-2">
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setIsMenuOpen(false);
              }}
              className="flex items-center bg-white rounded-full px-4 py-2 gap-2 border border-black/10"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products..."
                className="flex-1 bg-transparent text-sm text-gray-700 placeholder-gray-400 outline-none"
              />
              <button type="submit">
                <Search className="w-4 h-4 text-[#e8380d]" />
              </button>
            </form>
          </div>

          <div className="px-4 py-3 space-y-1">
            {[
              { href: '/', label: 'Home' },
              { href: '/shopping', label: 'All Products' },
              { href: '/pricing', label: 'Pricing' },
              { href: '/trade', label: 'Trade In' },
              { href: '/about', label: 'About' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2.5 text-gray-700 hover:text-gray-900 hover:bg-white/70 font-medium text-sm rounded-lg transition-colors"
              >
                {label}
              </Link>
            ))}

            <div className="pt-3 mt-2 border-t border-black/10 flex gap-2">
              <Link
                href="/cart"
                onClick={() => setIsMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 text-gray-700 hover:bg-white/70 font-medium text-sm rounded-lg transition-colors flex-1"
              >
                <ShoppingBag className="w-4 h-4" />
                <span suppressHydrationWarning>Cart ({cartCount})</span>
              </Link>

              <Link
                href="/sign_in"
                onClick={() => setIsMenuOpen(false)}
                className="flex-1 px-4 py-2.5 text-center text-sm font-semibold text-gray-700 border border-black/10 rounded-lg hover:bg-white/70 transition-colors"
              >
                Log in
              </Link>

              <Link
                href="/sign_up"
                onClick={() => setIsMenuOpen(false)}
                className="flex-1 px-4 py-2.5 text-center text-sm font-bold text-white bg-[#111111] rounded-lg hover:bg-[#000000] transition-colors"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
