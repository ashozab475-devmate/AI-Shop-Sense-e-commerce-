import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ShoppingLogic from './ShoppingLogic';
import VisualSearch from '../components/VisualSearch';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ShoppingPage({ searchParams }) {
  const params   = await searchParams;
  const search   = params?.search   || '';
  const category = params?.category || '';

  let products = [];
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const where = {};

    if (search) {
      where.OR = [
        { name:        { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category:    { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) {
      where.category = { equals: category, mode: 'insensitive' };
    }

    products = await prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  } catch (err) {
    console.error('ShoppingPage: failed to fetch products', err.message);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f192f] via-[#101c34] to-[#0c1527] text-white flex flex-col">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-32 pb-12 space-y-10">
        <ShoppingLogic
          initialProducts={products}
          initialSearch={search}
          initialCategory={category}
        />
      </main>

      {/* VisualSearch outside main so fixed positioning is never clipped */}
      <VisualSearch />

      <Footer />
    </div>
  );
}

