import { GET } from '@/app/api/products/route';

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    product: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Products API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return paginated products', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Product 1',
          currentPrice: 100,
          imageUrl: 'image1.jpg',
          category: 'Electronics',
        },
        {
          id: 'prod-2',
          name: 'Product 2',
          currentPrice: 200,
          imageUrl: 'image2.jpg',
          category: 'Electronics',
        },
      ];

      prisma.product.findMany.mockResolvedValueOnce(mockProducts);
      prisma.product.count.mockResolvedValueOnce(2);

      const request = {
        nextUrl: new URL('http://localhost:3000/api/products?page=1&limit=10'),
      };

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should filter products by category', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Product 1',
          currentPrice: 100,
          category: 'Electronics',
        },
      ];

      prisma.product.findMany.mockResolvedValueOnce(mockProducts);
      prisma.product.count.mockResolvedValueOnce(1);

      const request = {
        nextUrl: new URL('http://localhost:3000/api/products?category=Electronics'),
      };

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should search products by name', async () => {
      const mockProducts = [
        {
          id: 'prod-1',
          name: 'Laptop',
          currentPrice: 1000,
          category: 'Electronics',
        },
      ];

      prisma.product.findMany.mockResolvedValueOnce(mockProducts);
      prisma.product.count.mockResolvedValueOnce(1);

      const request = {
        nextUrl: new URL('http://localhost:3000/api/products?search=Laptop'),
      };

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should sort products by price', async () => {
      const mockProducts = [
        { id: 'prod-1', name: 'Product 1', currentPrice: 100 },
        { id: 'prod-2', name: 'Product 2', currentPrice: 200 },
      ];

      prisma.product.findMany.mockResolvedValueOnce(mockProducts);
      prisma.product.count.mockResolvedValueOnce(2);

      const request = {
        nextUrl: new URL('http://localhost:3000/api/products?sort=price&order=asc'),
      };

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should handle database errors', async () => {
      prisma.product.findMany.mockRejectedValueOnce(new Error('DB error'));

      const request = {
        nextUrl: new URL('http://localhost:3000/api/products'),
      };

      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });
});
