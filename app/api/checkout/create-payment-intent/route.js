import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  // ── All initialisations inside the handler — safe at build time ──────────
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'your-secret-key-change-me-in-production'
  );

  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.id || verified.payload.userId;

    const { shippingAddress } = await request.json();

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where:   { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount:   Math.round(totalAmount * 100), // cents
      currency: 'usd',
      metadata: { userId, cartId: cart.id },
    });

    return NextResponse.json({
      clientSecret:    paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalAmount,
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
