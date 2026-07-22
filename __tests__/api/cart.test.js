// __tests__/api/cart.test.js
import { GET, POST, DELETE, PUT } from '@/app/api/cart/route';
import { NextRequest } from 'next/server';

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    cart: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    cartItem: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

// Mock JWT
jest.mock('jose', () => ({
  jwtVerify: jest.fn(async (token, secret) => ({
    payload: { userId: 'test-user-id' },
  })),
}));

describe('Cart API Endpoints', () => {
  let mockRequest;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRequest = {
      headers: new Map([['authorization', 'Bearer test-token']]),
      json: jest.fn(),
    };
  });

  describe('GET /api/cart', () => {
    it('should return 401 if no token provided', async () => {
      const request = {
        headers: new Map(),
      };
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should return user cart with items', async () => {
      const response = await GET(mockRequest);
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/cart/add', () => {
    it('should add item to cart', async () => {
      mockRequest.json = jest.fn(async () => ({
        productId: 'product-1',
        quantity: 2,
      }));

      const response = await POST(mockRequest);
      expect(response.status).toBe(200);
    });

    it('should return 400 if productId missing', async () => {
      mockRequest.json = jest.fn(async () => ({
        quantity: 2,
      }));

      const response = await POST(mockRequest);
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/cart/update', () => {
    it('should update cart item quantity', async () => {
      mockRequest.json = jest.fn(async () => ({
        itemId: 'item-1',
        quantity: 5,
      }));

      const response = await PUT(mockRequest);
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/cart/remove', () => {
    it('should remove item from cart', async () => {
      mockRequest.json = jest.fn(async () => ({
        itemId: 'item-1',
      }));

      const response = await DELETE(mockRequest);
      expect(response.status).toBe(200);
    });
  });
});
