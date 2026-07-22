import { GET, POST } from '@/app/api/reviews/route';
import { jwtVerify } from 'jose';

jest.mock('jose');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    review: {
      findMany: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Reviews API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reviews', () => {
    it('should return reviews for a product', async () => {
      const mockReviews = [
        {
          id: 'review-1',
          productId: 'prod-1',
          userId: 'user-1',
          rating: 5,
          comment: 'Great product!',
          createdAt: new Date(),
        },
        {
          id: 'review-2',
          productId: 'prod-1',
          userId: 'user-2',
          rating: 4,
          comment: 'Good quality',
          createdAt: new Date(),
        },
      ];

      prisma.review.findMany.mockResolvedValueOnce(mockReviews);
      prisma.review.count.mockResolvedValueOnce(2);

      const request = {
        nextUrl: new URL('http://localhost:3000/api/reviews?productId=prod-1'),
      };

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should return 400 if productId is missing', async () => {
      const request = {
        nextUrl: new URL('http://localhost:3000/api/reviews'),
      };

      const response = await GET(request);
      expect(response.status).toBe(400);
    });

    it('should support pagination', async () => {
      prisma.review.findMany.mockResolvedValueOnce([]);
      prisma.review.count.mockResolvedValueOnce(0);

      const request = {
        nextUrl: new URL('http://localhost:3000/api/reviews?productId=prod-1&page=2&limit=5'),
      };

      const response = await GET(request);
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/reviews', () => {
    it('should create review with valid data', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-1' },
      });

      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'prod-1',
        rating: 4,
        reviewCount: 5,
      });

      prisma.review.create.mockResolvedValueOnce({
        id: 'review-1',
        productId: 'prod-1',
        userId: 'user-1',
        rating: 5,
        comment: 'Excellent!',
      });

      prisma.product.update.mockResolvedValueOnce({
        id: 'prod-1',
        rating: 4.5,
        reviewCount: 6,
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          productId: 'prod-1',
          rating: 5,
          comment: 'Excellent!',
        }),
      };

      const response = await POST(request);
      expect(response.status).toBe(201);
    });

    it('should return 401 if not authenticated', async () => {
      const request = {
        headers: new Map(),
        json: jest.fn(),
      };

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 if rating is invalid', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-1' },
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          productId: 'prod-1',
          rating: 6, // Invalid: should be 1-5
          comment: 'Good',
        }),
      };

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 404 if product not found', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-1' },
      });

      prisma.product.findUnique.mockResolvedValueOnce(null);

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          productId: 'invalid-prod',
          rating: 5,
          comment: 'Good',
        }),
      };

      const response = await POST(request);
      expect(response.status).toBe(404);
    });
  });
});
