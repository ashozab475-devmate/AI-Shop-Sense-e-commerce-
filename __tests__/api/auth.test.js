import { POST as signupPost } from '@/app/api/signup/route';
import { POST as signinPost } from '@/app/api/signin/route';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

jest.mock('bcryptjs');
jest.mock('jose');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Authentication API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/signup', () => {
    it('should create new user with valid credentials', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);
      bcrypt.hash.mockResolvedValueOnce('hashed_password');
      prisma.user.create.mockResolvedValueOnce({
        id: 'user-1',
        email: '<email>',
        name: 'Test User',
      });

      const request = {
        json: jest.fn().mockResolvedValueOnce({
          email: '<email>',
          password: 'password123',
          name: 'Test User',
        }),
      };

      const response = await signupPost(request);
      expect(response.status).toBe(201);
    });

    it('should return 400 if user already exists', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: '<email>',
      });

      const request = {
        json: jest.fn().mockResolvedValueOnce({
          email: '<email>',
          password: 'password123',
          name: 'Test User',
        }),
      };

      const response = await signupPost(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 if email is missing', async () => {
      const request = {
        json: jest.fn().mockResolvedValueOnce({
          password: 'password123',
          name: 'Test User',
        }),
      };

      const response = await signupPost(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 if password is missing', async () => {
      const request = {
        json: jest.fn().mockResolvedValueOnce({
          email: '<email>',
          name: 'Test User',
        }),
      };

      const response = await signupPost(request);
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/signin', () => {
    it('should return token for valid credentials', async () => {
      const hashedPassword = 'hashed_password';
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: '<email>',
        password: hashedPassword,
      });

      bcrypt.compare.mockResolvedValueOnce(true);

      const request = {
        json: jest.fn().mockResolvedValueOnce({
          email: '<email>',
          password: 'password123',
        }),
      };

      const response = await signinPost(request);
      expect(response.status).toBe(200);
    });

    it('should return 401 for invalid password', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        email: '<email>',
        password: 'hashed_password',
      });

      bcrypt.compare.mockResolvedValueOnce(false);

      const request = {
        json: jest.fn().mockResolvedValueOnce({
          email: '<email>',
          password: 'wrong_password',
        }),
      };

      const response = await signinPost(request);
      expect(response.status).toBe(401);
    });

    it('should return 401 if user not found', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      const request = {
        json: jest.fn().mockResolvedValueOnce({
          email: '<email>',
          password: 'password123',
        }),
      };

      const response = await signinPost(request);
      expect(response.status).toBe(401);
    });

    it('should return 400 if email is missing', async () => {
      const request = {
        json: jest.fn().mockResolvedValueOnce({
          password: 'password123',
        }),
      };

      const response = await signinPost(request);
      expect(response.status).toBe(400);
    });
  });
});
