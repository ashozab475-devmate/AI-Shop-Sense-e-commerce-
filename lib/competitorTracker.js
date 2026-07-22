import prisma from '@/lib/prisma';

export class CompetitorPriceTracker {
  constructor() {
    this.competitors = [
      {
        name: 'Amazon',
        baseUrl: 'https://www.amazon.com',
        selector: '.a-price-whole'
      },
      {
        name: 'eBay',
        baseUrl: 'https://www.ebay.com',
        selector: '.BOLD'
      },
      {
        name: 'Walmart',
        baseUrl: 'https://www.walmart.com',
        selector: '[data-testid="product-price"]'
      }
    ];
  }

  async addCompetitorPrice(productId, competitorName, price, url = null) {
    try {
      const existingPrice = await prisma.competitorPrice.findFirst({
        where: {
          productId,
          competitorName
        }
      });

      if (existingPrice) {
        return await prisma.competitorPrice.update({
          where: { id: existingPrice.id },
          data: {
            price,
            url,
            lastChecked: new Date()
          }
        });
      } else {
        return await prisma.competitorPrice.create({
          data: {
            productId,
            competitorName,
            price,
            url,
            lastChecked: new Date()
          }
        });
      }
    } catch (error) {
      console.error('Error adding competitor price:', error);
      throw error;
    }
  }

  async getCompetitorPrices(productId) {
    try {
      return await prisma.competitorPrice.findMany({
        where: { productId },
        orderBy: { lastChecked: 'desc' }
      });
    } catch (error) {
      console.error('Error fetching competitor prices:', error);
      throw error;
    }
  }

  async getAverageCompetitorPrice(productId) {
    try {
      const prices = await this.getCompetitorPrices(productId);
      
      if (prices.length === 0) return null;
      
      const sum = prices.reduce((acc, cp) => acc + cp.price, 0);
      const average = sum / prices.length;
      
      return {
        average,
        min: Math.min(...prices.map(p => p.price)),
        max: Math.max(...prices.map(p => p.price)),
        count: prices.length,
        competitors: prices
      };
    } catch (error) {
      console.error('Error calculating average competitor price:', error);
      throw error;
    }
  }

  async deleteCompetitorPrice(competitorPriceId) {
    try {
      return await prisma.competitorPrice.delete({
        where: { id: competitorPriceId }
      });
    } catch (error) {
      console.error('Error deleting competitor price:', error);
      throw error;
    }
  }
}

export default new CompetitorPriceTracker();
