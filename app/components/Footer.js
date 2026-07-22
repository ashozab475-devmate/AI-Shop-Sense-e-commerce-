'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

// Social icon SVGs inline (no extra dependency)
const IconInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
    <circle cx="12" cy="12" r="4"/>
    <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none"/>
  </svg>
);

const IconX = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.253 5.622 5.911-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const IconYoutube = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const MENU_LINKS = [
  { label: 'Home',     href: '/' },
  { label: 'Shopping', href: '/shopping' },
  { label: 'Pricing',  href: '/pricing' },
  { label: 'About',    href: '/about' },
];

const SHOP_LINKS = [
  { label: 'Smart Home',  href: '/shopping?category=Smart Home' },
  { label: 'Workspace',   href: '/shopping?category=Workspace' },
  { label: 'Wellness',    href: '/shopping?category=Wellness' },
  { label: 'Audio',       href: '/shopping?category=Audio' },
];

const ACCOUNT_LINKS = [
  { label: 'Sign In',   href: '/sign_in' },
  { label: 'Sign Up',   href: '/sign_up' },
  { label: 'Orders',    href: '/orders' },
  { label: 'Wishlist',  href: '/wishlist' },
];

export default function Footer() {
  return (
    <footer className="w-full bg-[#111111] text-white overflow-hidden">

      {/* ── Main footer body ─────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-14 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12">

          {/* LEFT — brand + contact */}
          <div className="space-y-6">
            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { icon: <IconInstagram />, href: '#' },
                { icon: <IconX />,         href: '#' },
                { icon: <IconYoutube />,   href: '#' },
              ].map(({ icon, href }, i) => (
                <a key={i} href={href}
                  className="w-9 h-9 rounded-full border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:border-white/60 transition-all">
                  {icon}
                </a>
              ))}
            </div>

            {/* Address */}
            <div className="space-y-1">
              <p className="text-white/70 text-sm leading-relaxed">
                ShopSense Platform<br />
                AI-Powered Visual Search
              </p>
            </div>

            {/* Contact */}
            <div className="space-y-1">
              <p className="text-white/70 text-sm">support@shopsense.ai</p>
              <p className="text-white/70 text-sm">(+92) 300 000 0000</p>
            </div>
          </div>

          {/* RIGHT — 3-column link menu */}
          <div className="grid grid-cols-3 gap-8">
            {/* Menu */}
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-5">Menu</p>
              <ul className="space-y-3">
                {MENU_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-sm text-white/70 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop */}
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-5">Shop</p>
              <ul className="space-y-3">
                {SHOP_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-sm text-white/70 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-white/40 uppercase mb-5">Account</p>
              <ul className="space-y-3">
                {ACCOUNT_LINKS.map(({ label, href }) => (
                  <li key={label}>
                    <Link href={href}
                      className="text-sm text-white/70 hover:text-white transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* ── Divider + Get Started ─────────────────────────────────────── */}
        <div className="flex items-center gap-4 mt-12 mb-8">
          <div className="flex-1 h-px bg-white/10"></div>
          <Link href="/sign_up"
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 border border-white/20 rounded-full text-sm font-semibold text-white hover:bg-white hover:text-black transition-all">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* ── Bottom row ───────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-white/30 max-w-xs leading-relaxed">
            From AI visual search to dynamic pricing. Our platform is here to elevate your shopping experience.
          </p>
          <div className="flex items-center gap-6">
            <Link href="#" className="text-xs font-bold tracking-widest text-white/40 hover:text-white uppercase transition-colors">
              Terms &amp; Conditions
            </Link>
            <Link href="#" className="text-xs font-bold tracking-widest text-white/40 hover:text-white uppercase transition-colors">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>

      {/* ── Massive watermark brand text ─────────────────────────────────── */}
      <div className="relative overflow-hidden h-24 select-none pointer-events-none">
        <p
          className="absolute bottom-0 left-0 font-black whitespace-nowrap leading-none"
          style={{
            fontSize: 'clamp(80px, 14vw, 160px)',
            color: 'rgba(255,255,255,0.04)',
            letterSpacing: '-0.03em',
            transform: 'translateY(20%)',
          }}
        >
          ShopSense.— ShopSense.
        </p>
      </div>

    </footer>
  );
}
