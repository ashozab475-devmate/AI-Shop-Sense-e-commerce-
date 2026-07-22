import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Category name mapping: DB categories → market_trends.json keys
const CATEGORY_MAP = {
  'Audio':      'Audio',
  'Smart Home': 'Smart Home',
  'Workspace':  'Workspace',
  'Wellness':   'Wellness',
  'Outdoors':   'Outdoors',
};

import fs from 'fs';
import path from 'path';

// Lazy-load market trends
let _marketTrends = null;
function getMarketTrends() {
  if (_marketTrends) return _marketTrends;
  try {
    const trendsPath = path.join(process.cwd(), 'market_trends.json');
    if (fs.existsSync(trendsPath)) {
      const raw = fs.readFileSync(trendsPath, 'utf-8');
      _marketTrends = JSON.parse(raw);
      console.log(`[PricingEngine] Loaded market trends for ${Object.keys(_marketTrends).length} categories`);
    } else {
      console.warn(`[PricingEngine] market_trends.json not found at ${trendsPath}`);
      _marketTrends = {};
    }
  } catch (err) {
    console.warn('[PricingEngine] Error loading market trends:', err.message);
    _marketTrends = {};
  }
  return _marketTrends;
}

export async function calculatePrice(productId, externalConfig) {
  try {
    let config = externalConfig;
    if (!config) {
      config = await prisma.pricingConfig.findFirst();
    }
    if (!config) {
      // Fallback defaults if DB is empty
      config = { stockWeight: 0.3, demandWeight: 0.4, competitorWeight: 0.3 };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        demandMetrics: true,
        competitorPrices: true,
      },
    });

    if (!product) throw new Error('Product not found');

    // ── 1. Demand score (real user purchases) ─────────────────────────────
    const purchaseCount       = product.demandMetrics?.purchaseCount || 0;
    const cartAddCount        = product.demandMetrics?.cartAddCount  || 0;
    const viewCount           = product.demandMetrics?.viewCount     || 0;
    // Weighted demand: purchases matter most, then cart adds, then views
    const rawDemand           = purchaseCount * 1.0 + cartAddCount * 0.3 + viewCount * 0.05;
    const normalizedDemandScore = Math.min(rawDemand / 150, 1); // 0–1

    // ── 2. Stock pressure ─────────────────────────────────────────────────
    const stockScore = product.stock / (product.maxStock || 100); // 0=empty, 1=full

    // ── 3. Competitor price impact ────────────────────────────────────────
    const competitorPrices = product.competitorPrices || [];
    const competitorAvg    = competitorPrices.length > 0
      ? competitorPrices.reduce((sum, cp) => sum + cp.price, 0) / competitorPrices.length
      : product.basePrice;
    const competitorRatio  = competitorAvg / product.basePrice;

    // ── 4. ABO Market trend score ─────────────────────────────────────────
    // Uses real category averages from the 6000-image ABO dataset
    const marketTrends = getMarketTrends();
    const aboCategory  = CATEGORY_MAP[product.category] || product.category;
    const categoryTrend    = marketTrends[aboCategory];
    const marketTrendScore = categoryTrend
      ? categoryTrend.market_trend_score   // e.g. +4.65 for Laptop, -0.87 for Food
      : 0;
    // Normalize to a small adjustment: clamp to [-0.3, +0.3]
    const normalizedMarketScore = Math.max(-0.3, Math.min(0.3, marketTrendScore * 0.05));

    // ── 5. Build price multiplier ─────────────────────────────────────────
    let priceMultiplier = 1;
    priceMultiplier += normalizedDemandScore   * config.demandWeight;      // demand pushes UP
    priceMultiplier -= stockScore              * config.stockWeight;       // full stock pushes DOWN
    priceMultiplier += (competitorRatio - 1)   * config.competitorWeight;  // competitor price
    priceMultiplier += normalizedMarketScore;                              // ABO market position

    // ── 6. Apply constraints ──────────────────────────────────────────────
    const maxMultiplier = 1 + config.maxIncreasePercent / 100;
    const minMultiplier = 1 - config.maxDecreasePercent / 100;
    priceMultiplier = Math.min(priceMultiplier, maxMultiplier);
    priceMultiplier = Math.max(priceMultiplier, minMultiplier);

    // ── 7. Enforce minimum profit margin ─────────────────────────────────
    let newPrice = product.basePrice * priceMultiplier;
    const minPrice = product.basePrice / (1 + config.minProfitMargin / 100);
    newPrice = Math.max(newPrice, minPrice);
    newPrice = Math.round(newPrice * 100) / 100;

    return {
      productId,
      oldPrice:            product.currentPrice,
      newPrice,
      basePrice:           product.basePrice,
      demandScore:         normalizedDemandScore,
      stockLevel:          product.stock,
      competitorAvg,
      marketTrendScore:    normalizedMarketScore,
      categoryMarketData:  categoryTrend || null,
      priceMultiplier:     Math.round(priceMultiplier * 100) / 100,
    };
  } catch (error) {
    console.error('Error calculating price:', error);
    throw error;
  }
}

export async function updateProductPrice(productId, newPrice, reason = 'manual') {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Record price history
    await prisma.priceHistory.create({
      data: {
        productId,
        oldPrice: product.currentPrice,
        newPrice,
        reason,
        stockLevel: product.stock,
      },
    });

    // Update product price
    const updated = await prisma.product.update({
      where: { id: productId },
      data: { currentPrice: newPrice },
    });

    return updated;
  } catch (error) {
    console.error('Error updating product price:', error);
    throw error;
  }
}

export async function updateAllPrices(config) {
  try {
    const products = await prisma.product.findMany({
      include: {
        demandMetrics: true,
        competitorPrices: true,
      },
    });

    const results = [];

    for (const product of products) {
      try {
        const priceData = await calculatePrice(product.id, config);
        
        if (Math.abs(priceData.newPrice - product.currentPrice) > 0.01) {
          await updateProductPrice(product.id, priceData.newPrice, 'auto_update');
          results.push({
            productId: product.id,
            success: true,
            oldPrice: product.currentPrice,
            newPrice: priceData.newPrice,
          });
        }
      } catch (error) {
        console.error(`Error updating price for product ${product.id}:`, error);
        results.push({
          productId: product.id,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error updating all prices:', error);
    throw error;
  }
}

export async function getPriceHistory(productId, limit = 30) {
  try {
    const history = await prisma.priceHistory.findMany({
      where: { productId },
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return history;
  } catch (error) {
    console.error('Error getting price history:', error);
    throw error;
  }
}

export async function getPricingAnalytics() {
  try {
    const products = await prisma.product.findMany({
      include: {
        priceHistory: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
        demandMetrics: true,
      },
    });

    const analytics = {
      totalProducts: products.length,
      avgBasePrice: products.reduce((sum, p) => sum + p.basePrice, 0) / products.length,
      avgCurrentPrice: products.reduce((sum, p) => sum + p.currentPrice, 0) / products.length,
      priceChanges: products.filter(p => p.currentPrice !== p.basePrice).length,
      topDemandProducts: products
        .sort((a, b) => (b.demandMetrics?.purchaseCount || 0) - (a.demandMetrics?.purchaseCount || 0))
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          basePrice: p.basePrice,
          currentPrice: p.currentPrice,
          demandCount: p.demandMetrics?.purchaseCount || 0,
        })),
      lowStockProducts: products
        .filter(p => p.stock < p.maxStock * 0.2)
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          name: p.name,
          stock: p.stock,
          maxStock: p.maxStock,
          currentPrice: p.currentPrice,
        })),
    };

    return analytics;
  } catch (error) {
    console.error('Error getting pricing analytics:', error);
    throw error;
  }
}
