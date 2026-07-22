import { PrismaClient } from '@prisma/client';
import { updateAllPrices } from './pricingEngine.js';

const prisma = new PrismaClient();

let schedulerInterval = null;

export async function startPricingScheduler() {
  try {
    const config = await prisma.pricingConfig.findFirst();
    if (!config) {
      console.log('No pricing config found. Pricing scheduler not started.');
      return;
    }

    const intervalMs = 30 * 60 * 1000; // 30 minutes — visible changes during demo

    const runUpdate = async () => {
      try {
        console.log(`[${new Date().toISOString()}] Starting scheduled price update...`);
        const results = await updateAllPrices(config);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        console.log(`[${new Date().toISOString()}] Price update completed. Success: ${successful}, Failed: ${failed}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error in scheduled price update:`, error);
      }
    };

    // Run immediately on startup, then on interval
    await runUpdate();
    schedulerInterval = setInterval(runUpdate, intervalMs);
    console.log(`Pricing scheduler started. Updates every ${config.updateFrequencyHours || 6} hours.`);
  } catch (error) {
    console.error('Error starting pricing scheduler:', error);
  }
}

export function stopPricingScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('Pricing scheduler stopped.');
  }
}

export function getPricingSchedulerStatus() {
  return {
    isRunning: schedulerInterval !== null,
    nextRun: null,
  };
}
