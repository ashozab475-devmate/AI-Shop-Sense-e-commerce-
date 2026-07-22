import { GET } from '@/app/api/orders/route';
import { jwtVerify } from 'jose';

jest.mock('jose');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    order: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

describe('Orders API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/orders', () => {
    it('should return 401 if no token provided', async () => {
      const request = {
        headers: new Map(),
      };
      const response = await GET(request);
      expect(response.status).toBe(401);
    });

    it('should return user orders', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
      };

      const response = await GET(request);
      expect(response.status).toBe(200);
    });

    it('should handle JWT verification errors', async () => {
      jwtVerify.mockRejectedValueOnce(new Error('Invalid token'));

      const request = {
        headers: new Map([['authorization', 'Bearer invalid-token']]),
      };

      const response = await GET(request);
      expect(response.status).toBe(500);
    });
  });
});
