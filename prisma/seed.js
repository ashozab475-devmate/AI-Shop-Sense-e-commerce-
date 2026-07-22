const { PrismaClient } = require('@prisma/client');
let mockProducts = require('../lib/mockData.js').mockProducts;

const prisma = new PrismaClient();

// Transform mockProducts to use basePrice and currentPrice
mockProducts = mockProducts.map(product => ({
    ...product,
    basePrice: product.price || product.basePrice || 0,
    currentPrice: product.price || product.currentPrice || 0,
    minPrice: (product.price || product.basePrice || 0) * 0.7,
    maxPrice: (product.price || product.basePrice || 0) * 1.5,
})).map(({ price, ...rest }) => rest);

async function main() {
    console.log('Seeding products with sample data...');

    await prisma.competitorPrice.deleteMany();
    await prisma.pricingConfig.deleteMany();
    await prisma.product.deleteMany();
    
    // 1. Create products
    await prisma.product.createMany({ data: mockProducts });
    const dbProducts = await prisma.product.findMany();
    console.log(`Created ${dbProducts.length} products.`);

    // 2. Create Pricing Config
    await prisma.pricingConfig.create({
        data: {
            stockWeight: 0.3,
            demandWeight: 0.4,
            competitorWeight: 0.3,
            maxIncreasePercent: 20,
            maxDecreasePercent: 15,
            minProfitMargin: 15,
        }
    });
    console.log('Created pricing configuration.');

    // 3. Create Competitor Prices
    const competitors = ['AuraMart', 'Zentrix', 'NovaRetail'];
    const competitorEntries = [];

    for (const product of dbProducts) {
        for (const comp of competitors) {
            // Random price between 90% and 110% of basePrice
            const compPrice = product.basePrice * (0.9 + Math.random() * 0.2);
            competitorEntries.push({
                productId: product.id,
                competitorName: comp,
                price: parseFloat(compPrice.toFixed(2)),
                url: `https://www.${comp.toLowerCase()}.com/p/${product.id}`
            });
        }
    }

    await prisma.competitorPrice.createMany({ data: competitorEntries });
    console.log(`Created ${competitorEntries.length} competitor price entries.`);

    console.log('Seeding finished.');
    await prisma.$disconnect();
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
