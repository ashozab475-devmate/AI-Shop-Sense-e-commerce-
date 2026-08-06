import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { sendOrderConfirmationEmail } from '@/lib/emailService';

// Tell Next.js this route is always dynamic (never statically built)
export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function POST(request) {
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

    // Create order
    const orderItems = cart.items.map(item => ({
      productId: item.productId,
      productName: item.product.name,
      quantity: item.quantity,
      price: item.price,
    }));

    const totalAmount = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const order = await prisma.order.create({
      data: {
        userId,
        items: orderItems,
        totalAmount,
        paymentId: paymentIntentId,
        shippingAddress,
        status: 'processing',
      },
    });

    // Clear cart
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });

    // Track purchase demand for each product — fire and forget
    const trackingPromises = cart.items.map(item =>
      prisma.demandMetrics.upsert({
        where:  { productId: item.productId },
        update: { purchaseCount: { increment: item.quantity }, cartAddCount: { increment: item.quantity } },
        create: { productId: item.productId, purchaseCount: item.quantity, cartAddCount: item.quantity, viewCount: 0 },
      }).catch(() => {})
    );
    await Promise.allSettled(trackingPromises);

    // Get user info for email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    // Send order confirmation email
    if (user) {
      await sendOrderConfirmationEmail(user, order);
    }

    return NextResponse.json({
      orderId: order.id,
      status: 'success',
      message: 'Order created successfully. Confirmation email sent.',
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
