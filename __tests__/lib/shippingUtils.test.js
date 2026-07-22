import {
  calculateShippingCost,
  getDeliveryEstimate,
  processReturn,
  calculateRefund,
} from '@/lib/shippingUtils';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    shippingRate: {
      findFirst: jest.fn(),
    },
    shipment: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    return: {
      create: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Shipping Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateShippingCost', () => {
    it('should calculate shipping cost based on weight and distance', async () => {
      const mockRate = {
        baseRate: 5,
        perKgRate: 0.5,
        perKmRate: 0.1,
      };

      prisma.shippingRate.findFirst.mockResolvedValueOnce(mockRate);

      const cost = await calculateShippingCost({
        weight: 2,
        distance: 100,
        destination: 'NYC',
      });

      expect(cost).toBeGreaterThan(0);
    });

    it('should apply discount for bulk orders', async () => {
      const mockRate = {
        baseRate: 5,
        perKgRate: 0.5,
        perKmRate: 0.1,
      };

      prisma.shippingRate.findFirst.mockResolvedValueOnce(mockRate);

      const cost = await calculateShippingCost({
        weight: 10,
        distance: 100,
        destination: 'NYC',
        itemCount: 5,
      });

      expect(cost).toBeGreaterThan(0);
    });

    it('should handle missing shipping rate', async () => {
      prisma.shippingRate.findFirst.mockResolvedValueOnce(null);

      await expect(
        calculateShippingCost({
          weight: 2,
          distance: 100,
          destination: 'NYC',
        })
      ).rejects.toThrow();
    });
  });

  describe('getDeliveryEstimate', () => {
    it('should return delivery estimate based on distance', () => {
      const estimate = getDeliveryEstimate(100);
      expect(estimate).toHaveProperty('minDays');
      expect(estimate).toHaveProperty('maxDays');
      expect(estimate.minDays).toBeLessThan(estimate.maxDays);
    });

    it('should return longer estimate for longer distances', () => {
      const shortEstimate = getDeliveryEstimate(50);
      const longEstimate = getDeliveryEstimate(500);

      expect(longEstimate.maxDays).toBeGreaterThan(shortEstimate.maxDays);
    });
  });

  describe('processReturn', () => {
    it('should create return record', async () => {
      prisma.return.create.mockResolvedValueOnce({
        id: 'return-1',
        orderId: 'order-1',
        status: 'pending',
      });

      const result = await processReturn({
        orderId: 'order-1',
        reason: 'Defective',
        items: ['item-1'],
      });

      expect(result).toHaveProperty('id');
      expect(prisma.return.create).toHaveBeenCalled();
    });

    it('should update return status', async () => {
      prisma.return.update.mockResolvedValueOnce({
        id: 'return-1',
        status: 'approved',
      });

      const result = await processReturn({
        returnId: 'return-1',
        status: 'approved',
      });

      expect(result.status).toBe('approved');
    });
  });

  describe('calculateRefund', () => {
    it('should calculate full refund for unopened items', () => {
      const refund = calculateRefund({
        orderTotal: 100,
        itemPrice: 50,
        condition: 'unopened',
        daysReturned: 5,
      });

      expect(refund).toBe(50);
    });

    it('should apply deduction for used items', () => {
      const refund = calculateRefund({
        orderTotal: 100,
        itemPrice: 50,
        condition: 'used',
        daysReturned: 5,
      });

      expect(refund).toBeLessThan(50);
      expect(refund).toBeGreaterThan(0);
    });

    it('should apply deduction for late returns', () => {
      const earlyRefund = calculateRefund({
        orderTotal: 100,
        itemPrice: 50,
        condition: 'unopened',
        daysReturned: 5,
      });

      const lateRefund = calculateRefund({
        orderTotal: 100,
        itemPrice: 50,
        condition: 'unopened',
        daysReturned: 25,
      });

      expect(lateRefund).toBeLessThan(earlyRefund);
    });

    it('should return 0 for non-returnable items', () => {
      const refund = calculateRefund({
        orderTotal: 100,
        itemPrice: 50,
        condition: 'damaged',
        daysReturned: 40,
      });

      expect(refund).toBe(0);
    });
  });
});
