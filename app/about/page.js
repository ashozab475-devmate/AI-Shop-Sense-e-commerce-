'use client';

export const dynamic = 'force-dynamic';

import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Search, Zap, TrendingUp, Shield, Users, Target, Award, Globe, Heart, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function About() {
  return (
    <div className="min-h-screen bg-[#f5f0e8]">
      <Navbar />

      <main className="pt-28 pb-20">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="inline-block px-4 py-1.5 bg-violet-50 text-violet-600 rounded-full text-sm font-semibold border border-violet-100">
                About ShopSense
              </span>
              <h1 className="text-5xl md:text-6xl font-black text-gray-900 leading-tight">
                Transforming Online Shopping with AI
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed">
                We're building the future of e-commerce by combining cutting-edge artificial intelligence
                with intuitive design to create seamless shopping experiences.
              </p>
              <div className="flex gap-6 pt-2">
                {[
                  { value: '6000+', label: 'Products' },
                  { value: '99%',   label: 'Accuracy' },
                  { value: '24/7',  label: 'Support' },
                ].map(({ value, label }, i) => (
                  <React.Fragment key={label}>
                    {i > 0 && <div className="w-px bg-gray-200"></div>}
                    <div className="text-center">
                      <div className="text-3xl font-black text-violet-600">{value}</div>
                      <div className="text-sm text-gray-500">{label}</div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className="relative h-[420px] rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-[#f5f0e8] flex flex-col items-center justify-center gap-6 p-8">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-center">
                  <Search className="w-8 h-8 text-violet-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">AI Visual Search</p>
                  <p className="text-sm text-gray-500">Upload any image</p>
                </div>
              </div>
              <div className="w-full h-px bg-gray-200"></div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-center">
                  <TrendingUp className="w-8 h-8 text-violet-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Dynamic Pricing</p>
                  <p className="text-sm text-gray-500">Real-time market trends</p>
                </div>
              </div>
              <div className="w-full h-px bg-gray-200"></div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-violet-50 rounded-2xl border border-violet-100 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-violet-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">Instant Results</p>
                  <p className="text-sm text-gray-500">Under 1 second response</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Mission & Vision ─────────────────────────────────────────── */}
        <section className="bg-[#f5f0e8] py-16 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center mb-5 border border-violet-100">
                  <Target className="w-5 h-5 text-violet-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Mission</h2>
                <p className="text-gray-500 leading-relaxed">
                  To revolutionize e-commerce by making product discovery as natural as showing a picture
                  to a friend. Shopping should be intuitive, fast, and personalized for every customer.
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200">
                <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center mb-5 border border-violet-100">
                  <Globe className="w-5 h-5 text-violet-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">Our Vision</h2>
                <p className="text-gray-500 leading-relaxed">
                  To become the world's most intelligent shopping platform, where AI understands not
                  just what you're looking for, but what you need before you even search for it.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Core Values ──────────────────────────────────────────────── */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-3">Our Core Values</h2>
              <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: Heart,  color: 'text-violet-600', bg: 'bg-violet-50', title: 'Customer First',    desc: 'Every decision starts with our customers\' needs and experiences in mind.' },
                { icon: Zap,    color: 'text-violet-600', bg: 'bg-violet-50', title: 'Innovation',        desc: 'We constantly push boundaries with cutting-edge AI and technology solutions.' },
                { icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50', title: 'Trust & Security',  desc: 'Your data and privacy are protected with enterprise-grade security measures.' },
              ].map(({ icon: Icon, color, bg, title, desc }) => (
                <div key={title} className="text-center p-6 rounded-2xl border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all">
                  <div className={`w-14 h-14 ${bg} rounded-full flex items-center justify-center mx-auto mb-4 border border-violet-100`}>
                    <Icon className={`w-7 h-7 ${color}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Technology Stack ─────────────────────────────────────────── */}
        <section className="bg-[#f5f0e8] border-y border-gray-100 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <span className="inline-block px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4 border border-violet-100">
                  Technology
                </span>
                <h2 className="text-3xl font-black text-gray-900 mb-5">Powered by Advanced AI</h2>
                <div className="space-y-4 text-gray-500 leading-relaxed text-sm">
                  <p>
                    ShopSense leverages <span className="text-violet-600 font-semibold">OpenAI's CLIP</span> (Contrastive Language-Image Pre-training),
                    a state-of-the-art neural network that bridges visual and textual understanding.
                  </p>
                  <p>
                    Our platform is trained on <span className="text-violet-600 font-semibold">6,000+ product images</span> across
                    25 categories, enabling highly accurate visual search. Upload a photo and our AI delivers relevant results instantly.
                  </p>
                  <p>
                    Built with <span className="text-violet-600 font-semibold">Next.js</span>,{' '}
                    <span className="text-violet-600 font-semibold">PyTorch</span>, and{' '}
                    <span className="text-violet-600 font-semibold">PostgreSQL</span> — ensuring scalability and reliability.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-5">Key Technologies</h3>
                <div className="space-y-3">
                  {[
                    'CLIP AI Model (OpenAI)',
                    'Next.js 15 & React 19',
                    'PyTorch & Transformers',
                    'PostgreSQL & Prisma ORM',
                    'FastAPI & Python Backend',
                    'Tailwind CSS',
                  ].map(tech => (
                    <div key={tech} className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-violet-500 rounded-full flex-shrink-0"></div>
                      <span className="text-gray-600 text-sm">{tech}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────────────── */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900 mb-3">What We Offer</h2>
              <div className="w-12 h-1 bg-gradient-to-r from-violet-500 to-purple-500 rounded-full mx-auto"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: Search,    bg: 'bg-violet-50', color: 'text-violet-600', title: 'AI Visual Search',       desc: 'Upload any image to find similar products instantly with our CLIP-powered search engine.' },
                { icon: TrendingUp,bg: 'bg-violet-50', color: 'text-violet-600', title: 'Smart Recommendations',  desc: 'Personalized product suggestions based on your browsing history and preferences.' },
                { icon: Users,     bg: 'bg-violet-50', color: 'text-violet-600', title: 'Seller Dashboard',       desc: 'Comprehensive tools for sellers to manage inventory, track sales, and grow their business.' },
                { icon: Shield,    bg: 'bg-violet-50', color: 'text-violet-600', title: 'Secure Payments',        desc: 'Enterprise-grade security ensures your transactions and data are always protected.' },
                { icon: Zap,       bg: 'bg-violet-50', color: 'text-violet-600', title: 'Lightning Fast',         desc: 'Optimized performance delivers search results in under 1 second.' },
                { icon: Award,     bg: 'bg-violet-50', color: 'text-violet-600', title: 'Quality Assurance',      desc: 'Every product is verified to ensure authenticity and quality standards.' },
              ].map(({ icon: Icon, bg, color, title, desc }) => (
                <div key={title} className="bg-white border border-gray-200 rounded-xl p-6 hover:border-violet-200 hover:shadow-md transition-all group">
                  <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4 border border-violet-100 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-3xl py-16 px-8 text-center">
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Ready to Experience the Future?</h2>
              <p className="text-gray-500 text-lg mb-8 max-w-xl mx-auto">
                Join thousands of users discovering products with AI-powered visual search
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/shopping"
                  className="inline-flex items-center gap-2 px-8 py-3.5 bg-gray-900 hover:bg-gray-700 text-white font-bold rounded-full transition-all hover:scale-105">
                  Start Shopping <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/seller"
                  className="inline-flex items-center gap-2 px-8 py-3.5 border-2 border-gray-900 text-gray-900 font-bold rounded-full hover:bg-gray-900 hover:text-white transition-all">
                  Become a Seller
                </Link>
              </div>
            </div>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}


