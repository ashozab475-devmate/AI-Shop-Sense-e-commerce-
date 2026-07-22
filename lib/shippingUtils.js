// lib/shippingUtils.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Initialize default shipping rates
 */
export async function initializeShippingRates() {
  const existingRates = await prisma.shippingRate.count();
  
  if (existingRates > 0) {
    console.log('Shipping rates already initialized');
    return;
  }

  const defaultRates = [
    // USA
    { country: 'USA', minWeight: 0, maxWeight: 5, baseCost: 5.99, perKgCost: 0.5, estimatedDays: 3, method: 'standard' },
    { country: 'USA', minWeight: 0, maxWeight: 5, baseCost: 12.99, perKgCost: 1.0, estimatedDays: 1, method: 'express' },
    { country: 'USA', minWeight: 5, maxWeight: 20, baseCost: 9.99, perKgCost: 0.75, estimatedDays: 3, method: 'standard' },
    { country: 'USA', minWeight: 5, maxWeight: 20, baseCost: 19.99, perKgCost: 1.5, estimatedDays: 1, method: 'express' },
    
    // Canada
    { country: 'Canada', minWeight: 0, maxWeight: 5, baseCost: 8.99, perKgCost: 0.75, estimatedDays: 5, method: 'standard' },
    { country: 'Canada', minWeight: 0, maxWeight: 5, baseCost: 15.99, perKgCost: 1.25, estimatedDays: 2, method: 'express' },
    { country: 'Canada', minWeight: 5, maxWeight: 20, baseCost: 12.99, perKgCost: 1.0, estimatedDays: 5, method: 'standard' },
    
    // UK
    { country: 'UK', minWeight: 0, maxWeight: 5, baseCost: 4.99, perKgCost: 0.4, estimatedDays: 2, method: 'standard' },
    { country: 'UK', minWeight: 0, maxWeight: 5, baseCost: 9.99, perKgCost: 0.8, estimatedDays: 1, method: 'express' },
    { country: 'UK', minWeight: 5, maxWeight: 20, baseCost: 7.99, perKgCost: 0.6, estimatedDays: 2, method: 'standard' },
    
    // Australia
    { country: 'Australia', minWeight: 0, maxWeight: 5, baseCost: 12.99, perKgCost: 1.0, estimatedDays: 7, method: 'standard' },
    { country: 'Australia', minWeight: 0, maxWeight: 5, baseCost: 24.99, perKgCost: 2.0, estimatedDays: 3, method: 'express' },
    { country: 'Australia', minWeight: 5, maxWeight: 20, baseCost: 18.99, perKgCost: 1.5, estimatedDays: 7, method: 'standard' },
  ];

  await prisma.shippingRate.createMany({
    data: defaultRates,
  });

  console.log(`Initialized ${defaultRates.length} shipping rates`);
}

/**
 * Calculate shipping cost
 */
export async function calculateShippingCost(weight, country, method = 'standard') {
  const rate = await prisma.shippingRate.findFirst({
    where: {
      country: { equals: country, mode: 'insensitive' },
      minWeight: { lte: weight },
      maxWeight: { gte: weight },
      method,
      active: true,
    },
  });

  if (!rate) {
    throw new Error(`Shipping not available for ${weight}kg to ${country} via ${method}`);
  }

  const cost = rate.baseCost + (weight * rate.perKgCost);
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + rate.estimatedDays);

  return {
    cost: parseFloat(cost.toFixed(2)),
    method: rate.method,
    estimatedDays: rate.estimatedDays,
    estimatedDelivery,
  };
}

/**
 * Get available shipping methods for a country
 */
export async function getShippingMethods(country) {
  const methods = await prisma.shippingRate.findMany({
    where: {
      country: { equals: country, mode: 'insensitive' },
      active: true,
    },
    select: {
      method: true,
      baseCost: true,
      perKgCost: true,
      estimatedDays: true,
    },
    distinct: ['method'],
  });

  return methods;
}

/**
 * Create shipment for order
 */
export async function createShipment(orderId, weight, carrier = 'Standard Carrier') {
  // Generate tracking number
  const trackingNumber = generateTrackingNumber();

  const shipment = await prisma.shipment.create({
    data: {
      orderId,
      trackingNumber,
      carrier,
      weight,
      status: 'pending',
    },
  });

  return shipment;
}

/**
 * Generate unique tracking number
 */
export function generateTrackingNumber() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SHP${timestamp}${random}`;
}

/**
 * Get shipment tracking info
 */
export async function getShipmentTracking(trackingNumber) {
  const shipment = await prisma.shipment.findUnique({
    where: { trackingNumber },
  });

  if (!shipment) {
    throw new Error('Shipment not found');
  }

  return shipment;
}

/**
 * Update shipment status
 */
export async function updateShipmentStatus(trackingNumber, status) {
  const validStatuses = ['pending', 'picked_up', 'in_transit', 'delivered', 'failed'];
  
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const shipment = await prisma.shipment.update({
    where: { trackingNumber },
    data: {
      status,
      lastUpdate: new Date(),
      ...(status === 'delivered' && { actualDelivery: new Date() }),
    },
  });

  // Update order status if delivered
  if (status === 'delivered') {
    await prisma.order.update({
      where: { id: shipment.orderId },
      data: { status: 'delivered' },
    });
  }

  return shipment;
}

/**
 * Create return request
 */
export async function createReturnRequest(orderId, reason, description) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const returnRequest = await prisma.return.create({
    data: {
      orderId,
      reason,
      description,
      status: 'pending',
      refundAmount: order.totalAmount,
    },
  });

  return returnRequest;
}

/**
 * Process refund
 */
export async function processRefund(returnId, refundAmount) {
  const returnRequest = await prisma.return.update({
    where: { id: returnId },
    data: {
      status: 'refunded',
      refundAmount,
    },
    include: { order: true },
  });

  // Update order status
  await prisma.order.update({
    where: { id: returnRequest.orderId },
    data: { status: 'refunded' },
  });

  return returnRequest;
}
