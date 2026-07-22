import { GET as getProfile, PUT as updateProfile } from '@/app/api/profile/route';
import { POST as changePassword } from '@/app/api/profile/change-password/route';
import { POST as uploadPicture } from '@/app/api/profile/upload-picture/route';
import { jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

jest.mock('jose');
jest.mock('bcryptjs');
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => ({
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  })),
}));

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('User Profile Management Flow Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Profile Management Flow', () => {
    it('should complete full profile update flow', async () => {
      const userId = 'user-123';

      // Step 1: Get current profile
      jwtVerify.mockResolvedValueOnce({
        payload: { userId },
      });

      prisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        email: '<email>',
        name: 'John Doe',
        phone: '555-1234',
        address: '123 Main St',
        profilePicture: null,
        createdAt: new Date(),
      });

      const getRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
      };

      const getResponse = await getProfile(getRequest);
      expect(getResponse.status).toBe(200);

      // Step 2: Update profile information
      jwtVerify.mockResolvedValueOnce({
        payload: { userId },
      });

      prisma.user.update.mockResolvedValueOnce({
        id: userId,
        email: '<email>',
        name: 'John Smith',
        phone: '555-5678',
        address: '456 Oak Ave',
      });

      const updateRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          name: 'John Smith',
          phone: '555-5678',
          address: '456 Oak Ave',
        }),
      };

      const updateResponse = await updateProfile(updateRequest);
      expect(updateResponse.status).toBe(200);

      // Step 3: Change password
      jwtVerify.mockResolvedValueOnce({
        payload: { userId },
      });

      prisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        password: 'old_hashed_password',
      });

      bcrypt.compare.mockResolvedValueOnce(true); // Old password matches
      bcrypt.hash.mockResolvedValueOnce('new_hashed_password');

      prisma.user.update.mockResolvedValueOnce({
        id: userId,
        password: 'new_hashed_password',
      });

      const passwordRequest = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          oldPassword: 'oldPassword123',
          newPassword: 'newPassword456',
        }),
      };

      const passwordResponse = await changePassword(passwordRequest);
      expect(passwordResponse.status).toBe(200);
    });

    it('should upload profile picture', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.user.update.mockResolvedValueOnce({
        id: 'user-123',
        profilePicture: 'https://cdn.example.com/profile-pic-123.jpg',
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        formData: jest.fn().mockResolvedValueOnce({
          get: jest.fn().mockReturnValue({
            stream: jest.fn(),
            name: 'profile.jpg',
          }),
        }),
      };

      const response = await uploadPicture(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Profile Update Validation', () => {
    it('should validate email format on update', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'user@',
      ];

      for (const email of invalidEmails) {
        const request = {
          headers: new Map([['authorization', 'Bearer token']]),
          json: jest.fn().mockResolvedValueOnce({
            email,
          }),
        };

        const response = await updateProfile(request);
        expect(response.status).toBe(400);
      }
    });

    it('should validate phone number format', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const invalidPhones = [
        '123', // Too short
        'abc-defg', // Invalid characters
        '555-12', // Incomplete
      ];

      for (const phone of invalidPhones) {
        const request = {
          headers: new Map([['authorization', 'Bearer token']]),
          json: jest.fn().mockResolvedValueOnce({
            phone,
          }),
        };

        const response = await updateProfile(request);
        expect(response.status).toBe(400);
      }
    });

    it('should prevent empty profile updates', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({}),
      };

      const response = await updateProfile(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Password Change Security', () => {
    it('should require old password verification', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        password: 'hashed_password',
      });

      bcrypt.compare.mockResolvedValueOnce(false); // Old password doesn't match

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          oldPassword: 'wrongPassword',
          newPassword: 'newPassword456',
        }),
      };

      const response = await changePassword(request);
      expect(response.status).toBe(401);
    });

    it('should validate new password strength', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        password: 'hashed_password',
      });

      bcrypt.compare.mockResolvedValueOnce(true);

      const weakPasswords = [
        '123', // Too short
        'password', // No numbers
        '12345678', // No letters
      ];

      for (const password of weakPasswords) {
        const request = {
          headers: new Map([['authorization', 'Bearer token']]),
          json: jest.fn().mockResolvedValueOnce({
            oldPassword: 'oldPassword123',
            newPassword: password,
          }),
        };

        const response = await changePassword(request);
        expect(response.status).toBe(400);
      }
    });

    it('should prevent reusing old password', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-123',
        password: 'hashed_old_password',
      });

      bcrypt.compare.mockResolvedValueOnce(true); // Old password matches
      bcrypt.compare.mockResolvedValueOnce(true); // New password same as old

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        json: jest.fn().mockResolvedValueOnce({
          oldPassword: 'oldPassword123',
          newPassword: 'oldPassword123', // Same as old
        }),
      };

      const response = await changePassword(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Profile Picture Upload', () => {
    it('should validate file type for profile picture', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const invalidFileTypes = ['document.pdf', 'video.mp4', 'archive.zip'];

      for (const filename of invalidFileTypes) {
        const request = {
          headers: new Map([['authorization', 'Bearer token']]),
          formData: jest.fn().mockResolvedValueOnce({
            get: jest.fn().mockReturnValue({
              stream: jest.fn(),
              name: filename,
            }),
          }),
        };

        const response = await uploadPicture(request);
        expect(response.status).toBe(400);
      }
    });

    it('should validate file size for profile picture', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      const largeFile = {
        stream: jest.fn(),
        name: 'large-image.jpg',
        size: 10 * 1024 * 1024, // 10MB (too large)
      };

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
        formData: jest.fn().mockResolvedValueOnce({
          get: jest.fn().mockReturnValue(largeFile),
        }),
      };

      const response = await uploadPicture(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Authorization and Security', () => {
    it('should prevent unauthorized profile access', async () => {
      jwtVerify.mockResolvedValueOnce({
        payload: { userId: 'user-123' },
      });

      prisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-456', // Different user
      });

      const request = {
        headers: new Map([['authorization', 'Bearer token']]),
      };

      const response = await getProfile(request);
      expect(response.status).toBe(403);
    });

    it('should require authentication for profile operations', async () => {
      const request = {
        headers: new Map(), // No auth header
      };

      const response = await getProfile(request);
      expect(response.status).toBe(401);
    });
  });
});
