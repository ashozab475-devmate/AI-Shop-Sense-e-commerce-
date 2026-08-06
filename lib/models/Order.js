/**
 * Order Model
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class OrderModel {
  static async findById(id) {
    return await prisma.order.findUnique({ where: { id } });
  }

  static async findByUser(userId) {
    return await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async create(data) {
    return await prisma.order.create({ data });
  }

  static async update(id, data) {
    return await prisma.order.update({ where: { id }, data });
  }

  static async findAll({ page = 1, limit = 20, status = null } = {}) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  }
}
