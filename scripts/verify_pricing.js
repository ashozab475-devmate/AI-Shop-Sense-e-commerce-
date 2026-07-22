const { calculatePrice } = require('../lib/pricingEngine');

async function testPricing() {
  console.log('--- Testing Dynamic Pricing ---');
  
  // Test products (these IDs should exist after seeding)
  const productIds = ['mock-ws-9', 'mock-sh-9']; // Headphones, Garden Controller
  
  for (const id of productIds) {
    try {
      console.log(`\nProduct ID: ${id}`);
      const result = await calculatePrice(id);
      
      console.log(`Base Price: $${result.basePrice}`);
      console.log(`Old Price: $${result.oldPrice}`);
      console.log(`New Price: $${result.newPrice}`);
      console.log('Factors:');
      console.log(` - Demand Score: ${result.demandScore.toFixed(3)}`);
      console.log(` - Stock Level: ${result.stockLevel}`);
      console.log(` - Competitor Avg: $${result.competitorAvg.toFixed(2)}`);
      console.log(` - Market Trend Score: ${result.marketTrendScore.toFixed(3)}`);
      console.log(` - Multiplier: ${result.priceMultiplier}`);
      
      if (result.newPrice !== result.oldPrice) {
        console.log('✅ Dynamic pricing has calculated a CHANGE');
      } else {
        console.log('ℹ️ Price remains steady');
      }
    } catch (error) {
      console.error(`Error calculating price for ${id}:`, error.message);
    }
  }
}

testPricing();
