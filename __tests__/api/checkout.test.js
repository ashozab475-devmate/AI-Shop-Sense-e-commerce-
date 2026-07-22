import { POST } from '@/app/api/checkout/create-payment-intent/route';
import { jwtVerify } from 'jose';
import Stripe from 'stripe';

jest.mock('jose');
jest.mock('stripe');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    cart: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
    },
  })),
}));

describe('Checkout API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/checkout/create-payment-intent', () => {
    it('should return 401 if no token provided', async () => {
      const request = {
        headers: new Map(),
        json: jest.fn(),
      };

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should create payment intent with valid token', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const mockStripe = {
        paymentIntents: {
          create: jest.fn().mockResolvedValueOnce({
            id: 'pi_123',
            client_secret: 'secret_123',
            amount: 10000,
          }),
        },
      };

      Stripe.mockReturnValueOnce(mockStripe);

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          amount: 10000,
          shippingAddress: { city: 'NYC' },
        }),
      };

      const response = await POST(request);
      expect(response.status).toBe(200);
    });

    it('should return 400 if amount is missing', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          shippingAddress: { city: 'NYC' },
        }),
      };

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should handle Stripe errors', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const mockStripe = {
        paymentIntents: {
          create: jest.fn().mockRejectedValueOnce(new Error('Stripe error')),
        },
      };

      Stripe.mockReturnValueOnce(mockStripe);

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          amount: 10000,
          shippingAddress: { city: 'NYC' },
        }),
      };

      const response = await POST(request);
      expect(response.status).toBe(500);
    });
  });
});
