'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';

export default function HeroSection() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob"></div>
        <div className="absolute top-40 right-20 w-72 h-72 bg-amber-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-40 animate-blob animation-delay-4000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Text Content */}
          <div className="text-center space-y-8 animate-fade-in">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-lg border border-orange-200">
              <Sparkles className="h-4 w-4 text-orange-500 mr-2" />
              <span className="text-sm font-semibold text-orange-600">
                Welcome to ShopSense
              </span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4 text-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-center">
                <span className="bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">
                  Shop Smart,
                </span>
                <br />
                <span className="text-gray-900">Shop Amazing</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 max-w-xl mx-auto text-center">
                Discover millions of products with fast delivery and amazing deals. 
                Your one-stop destination for everything you need.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shopping"
                className="group relative inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-orange-600 to-amber-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                <span className="relative flex items-center">
                  Start Shopping
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/sign_in"
                className="inline-flex items-center justify-center px-8 py-4 text-base font-semibold text-gray-700 bg-white rounded-xl border-2 border-gray-300 hover:border-orange-400 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-gray-200">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 text-center">100M+</div>
                <div className="text-sm text-gray-600 mt-1 text-center">Products</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 text-center">50M+</div>
                <div className="text-sm text-gray-600 mt-1 text-center">Customers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 text-center">99%</div>
                <div className="text-sm text-gray-600 mt-1 text-center">Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Column - Visual Content */}
          <div className="relative lg:block hidden">
            {/* Main Image/Illustration Container */}
            <div className="relative">
              {/* Floating Cards */}
              <div className="absolute -top-10 -right-10 bg-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-transform duration-300 animate-float">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900 text-center">25% Off</div>
                    <div className="text-sm text-gray-600 text-center">Today's Deals</div>
                  </div>
                </div>
              </div>

              {/* Center Main Visual */}
              <div className="relative bg-gradient-to-br from-orange-400 via-amber-400 to-yellow-400 rounded-3xl shadow-2xl p-12 transform hover:scale-105 transition-transform duration-500">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 border border-white/30">
                  <ShoppingBag className="h-32 w-32 text-white mx-auto" />
                </div>
              </div>

              {/* Bottom Left Card */}
              <div className="absolute -bottom-10 -left-10 bg-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-transform duration-300 animate-float-delayed">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 text-center">Fast</div>
                    <div className="text-sm text-gray-600 text-center">Delivery</div>
                  </div>
                </div>
              </div>

              {/* Top Left Card */}
              <div className="absolute top-20 -left-16 bg-white rounded-2xl shadow-2xl p-6 transform hover:scale-105 transition-transform duration-300 animate-float-slow">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Shield className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-gray-900 text-center">Secure</div>
                    <div className="text-sm text-gray-600 text-center">Payment</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center mb-4">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Fast Delivery</h3>
            <p className="text-gray-600 text-center">
              Get your orders delivered quickly and safely to your doorstep.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center mb-4">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Secure Shopping</h3>
            <p className="text-gray-600 text-center">
              Your data and payments are protected with industry-leading security.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-100 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-400 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Best Deals</h3>
            <p className="text-gray-600 text-center">
              Exclusive offers and deals on thousands of products every day.
            </p>
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes blob {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        
        @keyframes float-delayed {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }
        
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 3s ease-in-out infinite 0.5s;
        }
        
        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite 1s;
        }
        
        .animate-fade-in {
          animation: fade-in 1s ease-out;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

