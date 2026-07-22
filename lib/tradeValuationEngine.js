import prisma from '@/lib/prisma';

// Condition multipliers — how much of base value is retained
const CONDITION_MULTIPLIERS = {
  like_new: 0.85,
  good:     0.65,
  fair:     0.45,
  poor:     0.25,
};

const DEPRECIATION_RATE = 0.10;  // 10% per year
const MAX_AGE_YEARS     = 10;
const DEMAND_BOOST_MAX  = 0.20;  // up to +20% for high-demand items
const PLATFORM_FEE      = 0.15;  // 15% platform fee
const AGE_FLOOR         = 0.10;  // minimum 10% of base value regardless of age

/**
 * Calculate a trade-in valuation.
 * @param {string} productName
 * @param {string} category
 * @param {string} condition  - "like_new" | "good" | "fair" | "poor"
 * @param {number} ageYears
 * @returns {{ basePrice, conditionMultiplier, ageFactor, demandBoost, platformFee, estimatedValue, offeredValue, breakdown }}
 */
export async function calculateTradeValue({ productName, category, condition, ageYears }) {
  // 1. Find base price — exact name match first, then category average
  let basePrice = 0;

  const exactMatch = await prisma.product.findFirst({
    where: { name: { contains: productName, mode: 'insensitive' } },
    select: { basePrice: true, demandMetrics: { select: { purchaseCount: true } } },
  });

  if (exactMatch) {
    basePrice = exactMatch.basePrice;
  } else {
    // Category average
    const categoryProducts = await prisma.product.findMany({
      where: { category: { equals: category, mode: 'insensitive' } },
      select: { basePrice: true },
    });
    if (categoryProducts.length > 0) {
      basePrice = categoryProducts.reduce((s, p) => s + p.basePrice, 0) / categoryProducts.length;
    } else {
      basePrice = 50; // absolute fallback
    }
  }

  // 2. Condition multiplier
  const conditionMultiplier = CONDITION_MULTIPLIERS[condition] ?? 0.45;

  // 3. Age depreciation factor (floored at AGE_FLOOR)
  const clampedAge = Math.min(ageYears, MAX_AGE_YEARS);
  const ageFactor = Math.max(1 - DEPRECIATION_RATE * clampedAge, AGE_FLOOR);

  // 4. Demand boost (0–20% based on purchase count)
  let demandBoost = 0;
  if (exactMatch?.demandMetrics?.purchaseCount) {
    demandBoost = Math.min(exactMatch.demandMetrics.purchaseCount / 500, 1) * DEMAND_BOOST_MAX;
  }

  // 5. Estimated market value (what the item is worth)
  const estimatedValue = Math.round(basePrice * conditionMultiplier * ageFactor * (1 + demandBoost) * 100) / 100;

  // 6. Offered value (after platform fee)
  const offeredValue = Math.round(estimatedValue * (1 - PLATFORM_FEE) * 100) / 100;

  return {
    basePrice: Math.round(basePrice * 100) / 100,
    conditionMultiplier,
    ageFactor: Math.round(ageFactor * 100) / 100,
    demandBoost: Math.round(demandBoost * 100) / 100,
    platformFeePercent: PLATFORM_FEE * 100,
    estimatedValue,
    offeredValue,
    breakdown: {
      step1: `Base price: $${basePrice.toFixed(2)}`,
      step2: `After condition (${condition}, ×${conditionMultiplier}): $${(basePrice * conditionMultiplier).toFixed(2)}`,
      step3: `After age depreciation (${ageYears}yr, ×${ageFactor.toFixed(2)}): $${(basePrice * conditionMultiplier * ageFactor).toFixed(2)}`,
      step4: `After demand boost (+${(demandBoost * 100).toFixed(0)}%): $${estimatedValue.toFixed(2)}`,
      step5: `After platform fee (${PLATFORM_FEE * 100}%): $${offeredValue.toFixed(2)}`,
    },
  };
}
