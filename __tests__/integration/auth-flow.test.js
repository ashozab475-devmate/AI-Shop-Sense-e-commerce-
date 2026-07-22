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

describe('User Authentication Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Signup and Signin Flow', () => {
    it('should complete full user registration and login flow', async () => {
      const userData = {
        email: '<email>',
        password: 'SecurePassword123!',
        name: 'John Doe',
      };

      // Step 1: User signs up
      prisma.user.findUnique.mockResolvedValueOnce(null); // User doesn't exist
      bcrypt.hash.mockResolvedValueOnce('hashed_password_123');
      prisma.user.create.mockResolvedValueOnce({
        id: 'user-123',
        email: userData.email,
        name: userData.name,
        password: 'hashed_password_123',
        role: 'user',
        createdAt: new Date(),
      });

      const signupRequest = {
        json: jest.fn().mockResolvedValueOnce(userData),
      };

      const signupResponse = await signupPost(signupRequest);
      expect(signupResponse.status).toBe(201);

      // Step 2: User signs in with credentials
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email: userData.email,
        password: 'hashed_password_123',
        name: userData.name,
        role: 'user',
      });

      bcrypt.compare.mockResolvedValueOnce(true); // Password matches

      const signinRequest = {
        json: jest.fn().mockResolvedValueOnce({
          email: userData.email,
          password: userData.password,
        }),
      };

      const signinResponse = await signinPost(signinRequest);
      expect(signinResponse.status).toBe(200);
    });

    it('should prevent duplicate user registration', async () => {
      const userData = {
        email: '<email>',
        password: 'password123',
        name: 'John Doe',
      };

      // First signup attempt
      prisma.user.findUnique.mockResolvedValueOnce(null);
      bcrypt.hash.mockResolvedValueOnce('hashed_password');
      prisma.user.create.mockResolvedValueOnce({
        id: 'user-123',
        email: userData.email,
        name: userData.name,
      });

      const firstSignup = {
        json: jest.fn().mockResolvedValueOnce(userData),
      };

      const firstResponse = await signupPost(firstSignup);
      expect(firstResponse.status).toBe(201);

      // Second signup attempt with same email
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email: userData.email,
      });

      const secondSignup = {
        json: jest.fn().mockResolvedValueOnce(userData),
      };

      const secondResponse = await signupPost(secondSignup);
      expect(secondResponse.status).toBe(400);
    });

    it('should handle invalid credentials on signin', async () => {
      // User exists but password is wrong
      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        email: '<email>',
        password: 'hashed_password',
      });

      bcrypt.compare.mockResolvedValueOnce(false); // Password doesn't match

      const signinRequest = {
        json: jest.fn().mockResolvedValueOnce({
          email: '<email>',
          password: 'wrong_password',
        }),
      };

      const response = await signinPost(signinRequest);
      expect(response.status).toBe(401);
    });

    it('should handle non-existent user signin', async () => {
      prisma.user.findUnique.mockResolvedValueOnce(null);

      const signinRequest = {
        json: jest.fn().mockResolvedValueOnce({
          email: 'nonexistent@<email>',
          password: 'password123',
        }),
      };

      const response = await signinPost(signinRequest);
      expect(response.status).toBe(401);
    });
  });

  describe('User Registration Validation', () => {
    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
        'user @example.com',
      ];

      for (const email of invalidEmails) {
        const request = {
          json: jest.fn().mockResolvedValueOnce({
            email,
            password: 'password123',
            name: 'Test User',
          }),
        };

        const response = await signupPost(request);
        expect(response.status).toBe(400);
      }
    });

    it('should validate password strength', async () => {
      const weakPasswords = [
        '123', // Too short
        'password', // No numbers
        '12345678', // No letters
      ];

      for (const password of weakPasswords) {
        const request = {
          json: jest.fn().mockResolvedValueOnce({
            email: '<email>',
            password,
            name: 'Test User',
          }),
        };

        const response = await signupPost(request);
        expect(response.status).toBe(400);
      }
    });

    it('should require all mandatory fields', async () => {
      const incompleteData = [
        { email: '<email>', password: 'password123' }, // Missing name
        { email: '<email>', name: 'Test User' }, // Missing password
        { password: 'password123', name: 'Test User' }, // Missing email
      ];

      for (const data of incompleteData) {
        const request = {
          json: jest.fn().mockResolvedValueOnce(data),
        };

        const response = await signupPost(request);
        expect(response.status).toBe(400);
      }
    });
  });
});
