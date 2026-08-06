/**
 * Product Model
 * Business logic for Product entity
 */

import prisma from '../prisma';

export class ProductModel {
  /**
   * Find product by ID
   */
  static async findById(id, include = {}) {
    return await prisma.product.findUnique({
      where: { id },
      include: {
        reviews: include.reviews || false,
        priceHistory: include.priceHistory || false,
        demandMetrics: include.demandMetrics || false,
        ...include,
      },
    });
  }

  /**
   * Find all products with filters
   */
  static async findAll({
    page = 1,
    limit = 20,
    category = null,
    search = null,
    minPrice = null,
    maxPrice = null,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) {
    const skip = (page - 1) * limit;

    const where = {
      approved: true,
      ...(category && { category }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { brand: { contains: search, mode: 'insensitive' } },
        ],
      }),
      ...(minPrice !== null || maxPrice !== null
        ? {
            currentPrice: {
              ...(minPrice !== null && { gte: minPrice }),
              ...(maxPrice !== null && { lte: maxPrice }),
            },
          }
        : {}),
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
      }),
      prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Create product
   */
  static async create(data) {
    return await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        currentPrice: data.currentPrice || data.basePrice,
        minPrice: data.minPrice || data.basePrice * 0.7,
        maxPrice: data.maxPrice || data.basePrice * 1.5,
        category: data.category,
        image: data.image,
        imageUrl: data.imageUrl,
        stock: data.stock || 0,
        maxStock: data.maxStock || 100,
        brand: data.brand,
        warranty: data.warranty,
        approved: data.approved !== undefined ? data.approved : true,
        sellerId: data.sellerId,
      },
    });
  }

  /**
   * Update product
   */
  static async update(id, data) {
    return await prisma.product.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete product
   */
  static async delete(id) {
    return await prisma.product.delete({
      where: { id },
    });
  }

  /**
   * Get products by category
   */
  static async findByCategory(category, limit = 20) {
    return await prisma.product.findMany({
      where: { category, approved: true },
      take: limit,
      orderBy: { rating: 'desc' },
    });
  }

  /**
   * Get featured products
   */
  static async findFeatured(limit = 10) {
    return await prisma.product.findMany({
      where: { approved: true },
      take: limit,
      orderBy: [{ rating: 'desc' }, { sales: 'desc' }],
    });
  }

  /**
   * Track demand (view, cart add, purchase)
   */
  static async trackDemand(productId, action) {
    const metrics = await prisma.demandMetrics.upsert({
      where: { productId },
      create: {
        productId,
        viewCount: action === 'view' ? 1 : 0,
        cartAddCount: action === 'cart' ? 1 : 0,
        purchaseCount: action === 'purchase' ? 1 : 0,
        lastViewed: action === 'view' ? new Date() : null,
      },
      update: {
        ...(action === 'view' && {
          viewCount: { increment: 1 },
          lastViewed: new Date(),
        }),
        ...(action === 'cart' && { cartAddCount: { increment: 1 } }),
        ...(action === 'purchase' && { purchaseCount: { increment: 1 } }),
      },
    });

    return metrics;
  }

  /**
   * Update stock
   */
  static async updateStock(id, quantity) {
    return await prisma.product.update({
      where: { id },
      data: {
        stock: { increment: quantity },
      },
    });
  }
}
