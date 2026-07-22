import { POST as createPaymentIntent } from '@/app/api/checkout/create-payment-intent/route';
import { POST as confirmPayment } from '@/app/api/checkout/confirm-payment/route';
import { jwtVerify } from 'jose';
import Stripe from 'stripe';

jest.mock('jose');
jest.mock('stripe');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    cart: {
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    product: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Payment and Checkout Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Checkout Flow', () => {
    it('should complete full payment flow: create intent -> confirm -> create order', async () => {
      const userId = 'user-123';
      const cartTotal = 1109.97;

      // Step 1: Create payment intent
      jwtVerify.mockResolvedValueOnce({
        payload: { userId },
      });

      const mockStripe = {
        paymentIntents: {
          create: jest.fn().mockResolvedValueOnce({
            id: 'pi_123456',
            client_secret: 'pi_123456_secret_abc',
            amount: Math.round(cartTotal * 100),
            status: 'requires_payment_method',
          }),
        },
      };

      Stripe.mockReturnValueOnce(mockStripe);

      prisma.cart.findUnique.mockResolvedValueOnce({
        id: 'cart-1',
        userId,
        items: [
          {
            id: 'item-1',
            productId: 'prod-1',
            quantity: 1,
            price: 999.99,
            product: { id: 'prod-1', name: 'Laptop' },
          },
          {
            id: 'item-2',
            productId: 'prod-2',
            quantity: 2,
            price: 29.99,
            product: { id: 'prod-2', name: 'Mouse' },
          },
        ],
      });

      const createIntentRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          amount: cartTotal,
          shippingAddress: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            country: 'US',
          },
        }),
      };

      const createIntentResponse = await createPaymentIntent(createIntentRequest);
      expect(createIntentResponse.status).toBe(200);

      // Step 2: Confirm payment
      jwtVerify.mockResolvedValueOnce({
        payload: { userId },
      });

      mockStripe.paymentIntents.retrieve = jest.fn().mockResolvedValueOnce({
        id: 'pi_123456',
        status: 'succeeded',
        amount: Math.round(cartTotal * 100),
      });

      prisma.order.create.mockResolvedValueOnce({
        id: 'order-1',
        userId,
        items: [
          { productId: 'prod-1', quantity: 1, price: 999.99 },
          { productId: 'prod-2', quantity: 2, price: 29.99 },
        ],
        totalAmount: cartTotal,
        status: 'processing',
        paymentId: 'pi_123456',
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'US',
        },
      });

      prisma.cart.delete.mockResolvedValueOnce({ id: 'cart-1' });

      const confirmPaymentRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          paymentIntentId: 'pi_123456',
        }),
      };

      const confirmPaymentResponse = await confirmPayment(confirmPaymentRequest);
      expect(confirmPaymentResponse.status).toBe(200);
    });

    it('should handle payment failure gracefully', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const mockStripe = {
        paymentIntents: {
          create: jest.fn().mockRejectedValueOnce(
            new Error('Your card was declined')
          ),
        },
      };

      Stripe.mockReturnValueOnce(mockStripe);

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          amount: 1000,
          shippingAddress: { city: 'NYC' },
        }),
      };

      const response = await createPaymentIntent(request);
      expect(response.status).toBe(500);
    });

    it('should validate shipping address before payment', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const incompleteAddresses = [
        { city: 'NYC' }, // Missing street, state, zipCode
        { street: '123 Main St', city: 'NYC' }, // Missing state, zipCode
        { street: '123 Main St', state: 'NY' }, // Missing city, zipCode
      ];

      for (const address of incompleteAddresses) {
        const request = {
          headers: new Map([['authorization', 'Bearer token']]),
          json: jest.fn().mockResolvedValueOnce({
            amount: 1000,
            shippingAddress: address,
          }),
        };

        const response = await createPaymentIntent(request);
        expect(response.status).toBe(400);
      }
    });

    it('should prevent duplicate payment confirmation', async () => {
      jwtVerify.mockResolvedValue({
        payload: { userId: 'user-123' },
      });

      const mockStripe = {
        paymentIntents: {
          retrieve: jest.fn().mockResolvedValue({
            id: 'pi_123456',
            status: 'succeeded',
          }),
        },
      };

      Stripe.mockReturnValue(mockStripe);

      // First confirmation
      prisma.order.create.mockResolvedValueOnce({
        id: 'order-1',
        userId: 'user-123',
        paymentId: 'pi_123456',
      });

      prisma.cart.delete.mockResolvedValueOnce({ id: 'cart-1' });

      const request1 = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          paymentIntentId: 'pi_123456',
        }),
      };

      const response1 = await confirmPayment(request1);
      expect(response1.status).toBe(200);

      // Second confirmation attempt (should fail)
      prisma.order.findUnique.mockResolvedValueOnce({
        id: 'order-1',
        paymentId: 'pi_123456',
      });

      const request2 = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          paymentIntentId: 'pi_123456',
        }),
      };

      const response2 = await confirmPayment(request2);
      expect(response2.status).toBe(400);
    });

    it('should update product stock after successful payment', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const mockStripe = {
        paymentIntents: {
          retrieve: jest.fn().mockResolvedValueOnce({
            id: 'pi_123456',
            status: 'succeeded',
          }),
        },
      };

      Stripe.mockReturnValueOnce(mockStripe);

      const orderItems = [
        { productId: 'prod-1', quantity: 1 },
        { productId: 'prod-2', quantity: 2 },
      ];

      prisma.order.create.mockResolvedValueOnce({
        id: 'order-1',
        items: orderItems,
      });

      prisma.product.findUnique.mockResolvedValue({
        id: 'prod-1',
        stock: 10,
      });

      prisma.product.update.mockResolvedValue({
        id: 'prod-1',
        stock: 9,
      });

      prisma.cart.delete.mockResolvedValueOnce({ id: 'cart-1' });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          paymentIntentId: 'pi_123456',
        }),
      };

      const response = await confirmPayment(request);
      expect(response.status).toBe(200);
      expect(prisma.product.update).toHaveBeenCalled();
    });
  });

  describe('Payment Edge Cases', () => {
    it('should handle zero amount payment', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          amount: 0,
          shippingAddress: { city: 'NYC' },
        }),
      };

      const response = await createPaymentIntent(request);
      expect(response.status).toBe(400);
    });

    it('should handle negative amount payment', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          amount: -100,
          shippingAddress: { city: 'NYC' },
        }),
      };

      const response = await createPaymentIntent(request);
      expect(response.status).toBe(400);
    });

    it('should handle empty cart checkout', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.cart.findUnique.mockResolvedValueOnce({
        id: 'cart-1',
        userId: 'user-123',
        items: [], // Empty cart
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          amount: 0,
          shippingAddress: { city: 'NYC' },
        }),
      };

      const response = await createPaymentIntent(request);
      expect(response.status).toBe(400);
    });
  });
});
