/**
 * Auth Controller
 * Handles authentication logic
 */

import { UserModel } from '../models/User';
import jwt from 'jsonwebtoken';

export class AuthController {
  /**
   * Sign up new user
   */
  static async signUp(req) {
    try {
      const { name, email, password, phone, role } = req;

      // Validate required fields
      if (!name || !email || !password) {
        return {
          success: false,
          error: 'Name, email, and password are required',
          status: 400,
        };
      }

      // Check if user exists
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return {
          success: false,
          error: 'User already exists with this email',
          status: 400,
        };
      }

      // Create user
      const user = await UserModel.create({
        name,
        email,
        password,
        phone: phone || null,
        role: role || 'user',
      });

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
        status: 201,
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: 'Registration failed',
        status: 500,
      };
    }
  }

  /**
   * Sign in user
   */
  static async signIn(req) {
    try {
      const { email, password, loginAs } = req;

      // Validate required fields
      if (!email || !password) {
        return {
          success: false,
          error: 'Email and password are required',
          status: 400,
        };
      }

      // Find user
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return {
          success: false,
          error: 'Invalid email or password',
          status: 401,
        };
      }

      // Check if user uses Google OAuth
      if (!user.password && user.googleId) {
        return {
          success: false,
          error: 'This account uses Google sign-in. Please continue with Google.',
          status: 401,
        };
      }

      // Verify password
      const isValid = await UserModel.verifyPassword(password, user.password);
      if (!isValid) {
        return {
          success: false,
          error: 'Invalid email or password',
          status: 401,
        };
      }

      // Check role if specified
      if (loginAs && user.role !== loginAs) {
        return {
          success: false,
          error: `You don't have ${loginAs} privileges`,
          status: 403,
        };
      }

      // Update last login
      await UserModel.update(user.id, { lastLogin: new Date() });

      // Generate token
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      return {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        token,
        status: 200,
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: 'Sign in failed',
        status: 500,
      };
    }
  }

  /**
   * Verify JWT token
   */
  static verifyToken(token) {
    try {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      );
      return { valid: true, user: decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get current user from token
   */
  static async getCurrentUser(token) {
    try {
      const { valid, user } = this.verifyToken(token);

      if (!valid) {
        return { success: false, error: 'Invalid token', status: 401 };
      }

      const userData = await UserModel.findById(user.id);

      if (!userData) {
        return { success: false, error: 'User not found', status: 404 };
      }

      return {
        success: true,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          profilePicture: userData.profilePicture,
        },
        status: 200,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return {
        success: false,
        error: 'Failed to get user data',
        status: 500,
      };
    }
  }
}
