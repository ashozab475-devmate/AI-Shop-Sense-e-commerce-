import { GET as getOrders, POST as createOrder } from '@/app/api/orders/route';
import { GET as getOrderDetail, PUT as updateOrderStatus } from '@/app/api/orders/[orderId]/route';
import { POST as cancelOrder } from '@/app/api/orders/[orderId]/cancel/route';
import { jwtVerify } from 'jose';

jest.mock('jose');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Order Management Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Order Lifecycle', () => {
    it('should complete full order flow: create -> track -> update status', async () => {
      const userId = 'user-123';
      const orderId = 'order-1';

      // Step 1: Create order (after payment)
      jwtVerify.mockResolvedValueOnce({
        payload: { userId },
      });

      prisma.order.create.mockResolvedValueOnce({
        id: orderId,
        userId,
        items: [
          { productId: 'prod-1', quantity: 1, price: 999.99 },
        ],
        totalAmount: 999.99,
        status: 'pending',
        paymentId: 'pi_123456',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
        },
        createdAt: new Date(),
      });

      const createRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          items: [{ productId: 'prod-1', quantity: 1 }],
          totalAmount: 999.99,
          shippingAddress: { city: 'New York' },
        }),
      };

      const createResponse = await createOrder(createRequest);
      expect(createResponse.status).toBe(201);

      // Step 2: Get order details
      jwtVerify.mockResolvedValueOnce({
        payload: { userId },
      });

      prisma.order.findUnique.mockResolvedValueOnce({
        id: orderId,
        userId,
        items: [{ productId: 'prod-1', quantity: 1, price: 999.99 }],
        totalAmount: 999.99,
        status: 'pending',
        createdAt: new Date(),
      });

      const detailRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
        params: { orderId },
      };

      const detailResponse = await getOrderDetail(detailRequest);
      expect(detailResponse.status).toBe(200);

      // Step 3: Update order status (admin/system)
      prisma.order.update.mockResolvedValueOnce({
        id: orderId,
        status: 'processing',
      });

      const updateRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
        params: { orderId },
        json: jest.fn().mockResolvedValueOnce({
          status: 'processing',
        }),
      };

      const updateResponse = await updateOrderStatus(updateRequest);
      expect(updateResponse.status).toBe(200);

      // Step 4: Get all user orders
      jwtVerify.mockResolvedValueOnce({
        payload: { userId },
      });

      prisma.order.findMany.mockResolvedValueOnce([
        {
          id: orderId,
          userId,
          status: 'processing',
          totalAmount: 999.99,
          createdAt: new Date(),
        },
      ]);

      const ordersRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
      };

      const ordersResponse = await getOrders(ordersRequest);
      expect(ordersResponse.status).toBe(200);
    });

    it('should track order status progression', async () => {
      const orderId = 'order-1';
      const statuses = ['pending', 'processing', 'shipped', 'delivered'];

      for (const status of statuses) {
        jwtVerify.mockResolvedValueOnce({
          payload: { userId: 'user-123' },
        });

        prisma.order.update.mockResolvedValueOnce({
          id: orderId,
          status,
          updatedAt: new Date(),
        });

        const request = {
          headers: new Map([['authorization', 'Bearer token']]),
          params: { orderId },
          json: jest.fn().mockResolvedValueOnce({ status }),
        };

        const response = await updateOrderStatus(request);
        expect(response.status).toBe(200);
      }
    });

    it('should cancel order before shipment', async () => {
      const orderId = 'order-1';

      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.order.findUnique.mockResolvedValueOnce({
        id: orderId,
        status: 'pending',
        items: [{ productId: 'prod-1', quantity: 1 }],
        totalAmount: 999.99,
      });

      prisma.order.update.mockResolvedValueOnce({
        id: orderId,
        status: 'cancelled',
      });

      // Restore product stock
      prisma.product.findUnique.mockResolvedValueOnce({
        id: 'prod-1',
        stock: 9,
      });

      prisma.product.update.mockResolvedValueOnce({
        id: 'prod-1',
        stock: 10,
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        params: { orderId },
        json: jest.fn().mockResolvedValueOnce({
          reason: 'Changed my mind',
        }),
      };

      const response = await cancelOrder(request);
      expect(response.status).toBe(200);
      expect(prisma.product.update).toHaveBeenCalled();
    });

    it('should prevent cancellation of shipped orders', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-1',
        status: 'shipped', // Already shipped
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        params: { orderId: 'order-1' },
        json: jest.fn().mockResolvedValueOnce({
          reason: 'Changed my mind',
        }),
      };

      const response = await cancelOrder(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Order Retrieval and Filtering', () => {
    it('should retrieve user orders sorted by date', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const mockOrders = [
        {
          id: 'order-3',
          createdAt: new Date('2024-01-15'),
          status: 'delivered',
        },
        {
          id: 'order-2',
          createdAt: new Date('2024-01-10'),
          status: 'shipped',
        },
        {
          id: 'order-1',
          createdAt: new Date('2024-01-05'),
          status: 'processing',
        },
      ];

      prisma.order.findMany.mockResolvedValueOnce(mockOrders);

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
      };

      const response = await getOrders(request);
      expect(response.status).toBe(200);
    });

    it('should prevent unauthorized order access', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-1',
        userId: 'user-456', // Different user
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        params: { orderId: 'order-1' },
      };

      const response = await getOrderDetail(request);
      expect(response.status).toBe(403);
    });

    it('should handle non-existent order', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.order.findUnique.mockResolvedValueOnce(null);

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        params: { orderId: 'non-existent' },
      };

      const response = await getOrderDetail(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Order Status Validation', () => {
    it('should validate order status transitions', async () => {
      const invalidTransitions = [
        { from: 'delivered', to: 'pending' },
        { from: 'cancelled', to: 'processing' },
        { from: 'shipped', to: 'pending' },
      ];

      for (const transition of invalidTransitions) {
        jwtVerify.mockResolvedValueOnce({
          payload: { userId: 'user-123' },
        });

        prisma.order.findUnique.mockResolvedValueOnce({
          id: 'order-1',
          status: transition.from,
        });

        const request = {
          headers: new Map([['authorization', 'Bearer token']]),
          params: { orderId: 'order-1' },
          json: jest.fn().mockResolvedValueOnce({
            status: transition.to,
          }),
        };

        const response = await updateOrderStatus(request);
        expect(response.status).toBe(400);
      }
    });

    it('should handle invalid status values', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        params: { orderId: 'order-1' },
        json: jest.fn().mockResolvedValueOnce({
          status: 'invalid_status',
        }),
      };

      const response = await updateOrderStatus(request);
      expect(response.status).toBe(400);
    });
  });
});
