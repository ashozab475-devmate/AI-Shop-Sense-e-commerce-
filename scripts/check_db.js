const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDB() {
  const config = await prisma.pricingConfig.findFirst();
  console.log('Pricing Config:', config);
  
  const productCount = await prisma.product.count();
  console.log('Product Count:', productCount);
  
  const compCount = await prisma.competitorPrice.count();
  console.log('Competitor Price Count:', compCount);
  
  await prisma.$disconnect();
}

checkDB();
