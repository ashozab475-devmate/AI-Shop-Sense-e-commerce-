/**
 * User Model
 * Business logic for User entity
 */

import prisma from '../prisma';
import bcrypt from 'bcryptjs';

export class UserModel {
  /**
   * Find user by email
   */
  static async findByEmail(email) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  /**
   * Find user by Google ID
   */
  static async findByGoogleId(googleId) {
    return await prisma.user.findUnique({
      where: { googleId },
    });
  }

  /**
   * Create new user
   */
  static async create(data) {
    // Hash password if provided
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password: data.password || null,
        role: data.role || 'user',
        googleId: data.googleId || null,
        profilePicture: data.profilePicture || null,
      },
    });
  }

  /**
   * Update user
   */
  static async update(id, data) {
    // Hash password if being updated
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }

    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  /**
   * Verify password
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Get user with related data
   */
  static async findWithRelations(id, include = {}) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        cart: include.cart || false,
        orders: include.orders || false,
        wishlist: include.wishlist || false,
        ...include,
      },
    });
  }

  /**
   * Delete user
   */
  static async delete(id) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  /**
   * Get all users with pagination
   */
  static async findAll({ page = 1, limit = 20, role = null }) {
    const skip = (page - 1) * limit;
    const where = role ? { role } : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          lastLogin: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
