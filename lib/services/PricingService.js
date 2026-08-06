/**
 * Pricing Service
 * Dynamic pricing business logic
 */

import { ProductModel } from '../models/Product';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class PricingService {
  /**
   * Calculate dynamic price based on stock & demand
   */
  static async calculatePrice(productId) {
    try {
      const product = await ProductModel.findById(productId, {
        demandMetrics: true,
        priceHistory: { take: 10, orderBy: { timestamp: 'desc' } },
      });

      if (!product) throw new Error('Product not found');

      const { basePrice, stock, maxStock, minPrice, maxPrice } = product;
      const metrics = product.demandMetrics;

      // Stock factor (0 to 1, lower stock → higher price)
      const stockRatio = stock / maxStock;
      const stockFactor = 1 - stockRatio * 0.3; // Max 30% increase

      // Demand factor (based on views vs purchases)
      const demandRatio = metrics
        ? (metrics.cartAddCount * 2 + metrics.purchaseCount * 5) / (metrics.viewCount || 1)
        : 0;
      const demandFactor = 1 + Math.min(demandRatio, 0.2); // Max 20% increase

      // Calculate new price
      let newPrice = basePrice * stockFactor * demandFactor;

      // Clamp to min/max
      newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
      newPrice = Math.round(newPrice * 100) / 100; // 2 decimals

      return { newPrice, oldPrice: product.currentPrice };
    } catch (error) {
      console.error('PricingService.calculatePrice error:', error);
      throw error;
    }
  }

  /**
   * Update product price and log history
   */
  static async updatePrice(productId) {
    try {
      const { newPrice, oldPrice } = await this.calculatePrice(productId);

      // Only update if significant change (> 1%)
      if (Math.abs(newPrice - oldPrice) / oldPrice < 0.01) {
        return { updated: false, currentPrice: oldPrice };
      }

      // Update price
      await ProductModel.update(productId, { currentPrice: newPrice });

      // Log history
      await prisma.priceHistory.create({
        data: {
          productId,
          oldPrice,
          newPrice,
          reason: 'dynamic_pricing',
        },
      });

      return { updated: true, oldPrice, newPrice };
    } catch (error) {
      console.error('PricingService.updatePrice error:', error);
      throw error;
    }
  }

  /**
   * Bulk update prices for all products
   */
  static async updateAllPrices() {
    try {
      const products = await prisma.product.findMany({
        where: { approved: true },
        select: { id: true },
      });

      const results = { updated: 0, skipped: 0, errors: 0 };

      for (const product of products) {
        try {
          const result = await this.updatePrice(product.id);
          if (result.updated) results.updated++;
          else results.skipped++;
        } catch (error) {
          results.errors++;
        }
      }

      return results;
    } catch (error) {
      console.error('PricingService.updateAllPrices error:', error);
      throw error;
    }
  }
}
