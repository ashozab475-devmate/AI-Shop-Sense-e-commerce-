import {
  calculatePrice,
  updateProductPrice,
  getPriceHistory,
  getPricingAnalytics,
} from '@/lib/pricingEngine';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    product: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    priceHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Pricing Engine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculatePrice', () => {
    it('should calculate price based on demand and stock', async () => {
      const mockProduct = {
        id: 'prod-1',
        basePrice: 100,
        currentPrice: 100,
        stock: 50,
        maxStock: 100,
        demandMetrics: { purchaseCount: 50 },
        competitorPrices: [{ price: 105 }, { price: 95 }],
      };

      prisma.product.findUnique.mockResolvedValueOnce(mockProduct);

      const config = {
        demandWeight: 0.3,
        stockWeight: 0.2,
        competitorWeight: 0.1,
        maxIncreasePercent: 20,
        maxDecreasePercent: 10,
        minProfitMargin: 15,
      };

      const result = await calculatePrice('prod-1', config);

      expect(result).toHaveProperty('productId', 'prod-1');
      expect(result).toHaveProperty('newPrice');
      expect(result).toHaveProperty('demandScore');
      expect(result).toHaveProperty('stockLevel');
    });

    it('should throw error if product not found', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);

      const config = {
        demandWeight: 0.3,
        stockWeight: 0.2,
        competitorWeight: 0.1,
        maxIncreasePercent: 20,
        maxDecreasePercent: 10,
        minProfitMargin: 15,
      };

      await expect(calculatePrice('invalid-id', config)).rejects.toThrow(
        'Product not found'
      );
    });

    it('should respect max price increase constraint', async () => {
      const mockProduct = {
        id: 'prod-1',
        basePrice: 100,
        currentPrice: 100,
        stock: 10,
        maxStock: 100,
        demandMetrics: { purchaseCount: 200 },
        competitorPrices: [{ price: 150 }],
      };

      prisma.product.findUnique.mockResolvedValueOnce(mockProduct);

      const config = {
        demandWeight: 0.5,
        stockWeight: 0.3,
        competitorWeight: 0.2,
        maxIncreasePercent: 15,
        maxDecreasePercent: 10,
        minProfitMargin: 15,
      };

      const result = await calculatePrice('prod-1', config);

      expect(result.newPrice).toBeLessThanOrEqual(100 * 1.15);
    });
  });

  describe('updateProductPrice', () => {
    it('should update product price and record history', async () => {
      const mockProduct = {
        id: 'prod-1',
        currentPrice: 100,
      };

      prisma.product.findUnique.mockResolvedValueOnce(mockProduct);
      prisma.priceHistory.create.mockResolvedValueOnce({});
      prisma.product.update.mockResolvedValueOnce({
        ...mockProduct,
        currentPrice: 110,
      });

      const result = await updateProductPrice('prod-1', 110, 'manual');

      expect(prisma.priceHistory.create).toHaveBeenCalled();
      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 'prod-1' },
        data: { currentPrice: 110 },
      });
      expect(result.currentPrice).toBe(110);
    });

    it('should throw error if product not found', async () => {
      prisma.product.findUnique.mockResolvedValueOnce(null);

      await expect(updateProductPrice('invalid-id', 110)).rejects.toThrow(
        'Product not found'
      );
    });
  });

  describe('getPriceHistory', () => {
    it('should return price history for product', async () => {
      const mockHistory = [
        { productId: 'prod-1', oldPrice: 100, newPrice: 105, timestamp: new Date() },
        { productId: 'prod-1', oldPrice: 95, newPrice: 100, timestamp: new Date() },
      ];

      prisma.priceHistory.findMany.mockResolvedValueOnce(mockHistory);

      const result = await getPriceHistory('prod-1', 30);

      expect(result).toHaveLength(2);
      expect(prisma.priceHistory.findMany).toHaveBeenCalledWith({
        where: { productId: 'prod-1' },
        orderBy: { timestamp: 'desc' },
        take: 30,
      });
    });
  });

  describe('getPricingAnalytics', () => {
    it('should return pricing analytics', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          basePrice: 100,
          currentPrice: 110,
          stock: 50,
          maxStock: 100,
          demandMetrics: { purchaseCount: 100 },
          priceHistory: [],
        },
        {
          id: 'prod-2',
          basePrice: 200,
          currentPrice: 200,
          stock: 5,
          maxStock: 100,
          demandMetrics: { purchaseCount: 50 },
          priceHistory: [],
        },
      ];

      prisma.product.findMany.mockResolvedValueOnce(mockProducts);

      const result = await getPricingAnalytics();

      expect(result).toHaveProperty('totalProducts', 2);
      expect(result).toHaveProperty('avgBasePrice');
      expect(result).toHaveProperty('avgCurrentPrice');
      expect(result).toHaveProperty('priceChanges');
      expect(result).toHaveProperty('topDemandProducts');
      expect(result).toHaveProperty('lowStockProducts');
    });
  });
});
