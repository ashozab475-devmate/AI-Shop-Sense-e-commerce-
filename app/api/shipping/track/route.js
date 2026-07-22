import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'your-secret-key-change-me-in-production');

export async function GET(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.id || verified.payload.userId;

    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');
    const trackingNumber = searchParams.get('trackingNumber');

    if (!orderId && !trackingNumber) {
      return NextResponse.json(
        { error: 'Order ID or tracking number required' },
        { status: 400 }
      );
    }

    // Get order to verify ownership
    let order = null;
    if (orderId) {
      order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { user: { select: { id: true } } },
      });

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // Verify user owns this order
      if (order.user.id !== userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    }

    // Get shipment info
    const shipment = await prisma.shipment.findFirst({
      where: {
        ...(orderId && { orderId }),
        ...(trackingNumber && { trackingNumber }),
      },
    });

    if (!shipment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Generate mock tracking events
    const trackingEvents = generateTrackingEvents(shipment);

    return NextResponse.json({
      success: true,
      shipment: {
        trackingNumber: shipment.trackingNumber,
        carrier: shipment.carrier,
        status: shipment.status,
        weight: shipment.weight,
        estimatedDelivery: shipment.estimatedDelivery,
        actualDelivery: shipment.actualDelivery,
        lastUpdate: shipment.lastUpdate,
      },
      events: trackingEvents,
    });
  } catch (error) {
    console.error('Get tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.headers.get('authorization')?.split(' ')[1];
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const verified = await jwtVerify(token, secret);
    const userId = verified.payload.id || verified.payload.userId;

    // Check if user is admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { trackingNumber, status, actualDelivery } = await request.json();

    if (!trackingNumber || !status) {
      return NextResponse.json(
        { error: 'Tracking number and status required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'picked_up', 'in_transit', 'delivered', 'failed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Update shipment
    const shipment = await prisma.shipment.update({
      where: { trackingNumber },
      data: {
        status,
        actualDelivery: actualDelivery ? new Date(actualDelivery) : null,
        lastUpdate: new Date(),
      },
    });

    // Update order status if delivered
    if (status === 'delivered') {
      await prisma.order.update({
        where: { id: shipment.orderId },
        data: { status: 'delivered' },
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Shipment updated successfully',
      shipment,
    });
  } catch (error) {
    console.error('Update tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to generate mock tracking events
function generateTrackingEvents(shipment) {
  const events = [];
  const createdDate = new Date(shipment.createdAt);

  // Pending event
  events.push({
    status: 'pending',
    timestamp: createdDate,
    location: 'Warehouse',
    description: 'Shipment created and pending pickup',
  });

  if (['picked_up', 'in_transit', 'delivered'].includes(shipment.status)) {
    const pickedUpDate = new Date(createdDate);
    pickedUpDate.setHours(pickedUpDate.getHours() + 2);
    events.push({
      status: 'picked_up',
      timestamp: pickedUpDate,
      location: 'Local Facility',
      description: 'Package picked up from warehouse',
    });
  }

  if (['in_transit', 'delivered'].includes(shipment.status)) {
    const inTransitDate = new Date(createdDate);
    inTransitDate.setHours(inTransitDate.getHours() + 6);
    events.push({
      status: 'in_transit',
      timestamp: inTransitDate,
      location: 'Distribution Center',
      description: 'Package in transit to destination',
    });
  }

  if (shipment.status === 'delivered') {
    const deliveredDate = shipment.actualDelivery || new Date(createdDate);
    deliveredDate.setDate(deliveredDate.getDate() + 3);
    events.push({
      status: 'delivered',
      timestamp: deliveredDate,
      location: 'Delivery Address',
      description: 'Package delivered successfully',
    });
  }

  if (shipment.status === 'failed') {
    const failedDate = new Date(createdDate);
    failedDate.setDate(failedDate.getDate() + 2);
    events.push({
      status: 'failed',
      timestamp: failedDate,
      location: 'Delivery Address',
      description: 'Delivery attempt failed. Will retry.',
    });
  }

  return events;
}
