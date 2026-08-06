import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jwtVerify } from 'jose';
import Stripe from 'stripe';
import { sendOrderConfirmationEmail } from '@/lib/emailService';

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

    const { paymentIntentId, shippingAddress } = await request.json();

    // Verify payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 });
    }

    // Get user's cart
    const cart = await prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
    }

    // Build order items
    const orderItems = cart.items.map(item => ({
      productId:   item.productId,
      productName: item.product.name,
      quantity:    item.quantity,
      price:       item.price,
    }));

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        items:           orderItems,
        totalAmount,
        total:           totalAmount,
        paymentId:       paymentIntentId,
        shippingAddress,
        status:          'processing',
      },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });

    // Track purchase demand — fire and forget
    await Promise.allSettled(
      cart.items.map(item =>
        prisma.demandMetrics.upsert({
          where:  { productId: item.productId },
          update: {
            purchaseCount: { increment: item.quantity },
            cartAddCount:  { increment: item.quantity },
          },
          create: {
            productId:     item.productId,
            purchaseCount: item.quantity,
            cartAddCount:  item.quantity,
            viewCount:     0,
          },
        }).catch(() => {})
      )
    );

    // Send order confirmation email
    const user = await prisma.user.findUnique({
      where:  { id: userId },
      select: { name: true, email: true },
    });
    if (user) await sendOrderConfirmationEmail(user, order);

    return NextResponse.json({
      orderId: order.id,
      status:  'success',
      message: 'Order created successfully.',
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
