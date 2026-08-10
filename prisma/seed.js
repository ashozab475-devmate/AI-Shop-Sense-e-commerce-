const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Real products with working image URLs
const seedProducts = [
  { name: 'iPhone 15 Pro Max', description: 'Latest Apple flagship with titanium design and A17 Pro chip.', category: 'Smartphones', imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&q=80', basePrice: 1199.99, currentPrice: 1199.99, minPrice: 899.99, maxPrice: 1399.99, stock: 45, maxStock: 100, rating: 4.8, reviewCount: 1240, brand: 'Apple', approved: true, sales: 320 },
  { name: 'Samsung Galaxy S24 Ultra', description: 'Samsung\'s most powerful smartphone with AI features.', category: 'Smartphones', imageUrl: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80', basePrice: 1099.99, currentPrice: 999.99, minPrice: 799.99, maxPrice: 1299.99, stock: 38, maxStock: 100, rating: 4.7, reviewCount: 876, brand: 'Samsung', approved: true, sales: 280 },
  { name: 'Sony WH-1000XM5 Headphones', description: 'Industry-leading noise cancelling wireless headphones.', category: 'Electronics', imageUrl: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=800&q=80', basePrice: 399.99, currentPrice: 349.99, minPrice: 299.99, maxPrice: 449.99, stock: 62, maxStock: 150, rating: 4.9, reviewCount: 2341, brand: 'Sony', approved: true, sales: 510 },
  { name: 'MacBook Pro 14" M3', description: 'Apple M3 chip for incredible professional performance.', category: 'Laptops', imageUrl: 'https://images.unsplash.com/photo-1611186871525-9e3a6d6e1d9c?w=800&q=80', basePrice: 1999.99, currentPrice: 1899.99, minPrice: 1699.99, maxPrice: 2299.99, stock: 22, maxStock: 50, rating: 4.9, reviewCount: 654, brand: 'Apple', approved: true, sales: 180 },
  { name: 'Nike Air Max 270', description: 'Iconic Nike silhouette with large Air unit for all-day comfort.', category: 'Shoes', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80', basePrice: 159.99, currentPrice: 139.99, minPrice: 119.99, maxPrice: 179.99, stock: 120, maxStock: 200, rating: 4.6, reviewCount: 3210, brand: 'Nike', approved: true, sales: 890 },
  { name: 'Levi\'s 501 Original Jeans', description: 'The original straight fit jeans. Timeless American style.', category: 'Jeans', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&q=80', basePrice: 89.99, currentPrice: 79.99, minPrice: 59.99, maxPrice: 109.99, stock: 200, maxStock: 300, rating: 4.5, reviewCount: 5430, brand: 'Levis', approved: true, sales: 1200 },
  { name: 'Modern Sectional Sofa', description: 'L-shaped sectional with deep seating and premium fabric.', category: 'Sofas', imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80', basePrice: 1499.99, currentPrice: 1299.99, minPrice: 1099.99, maxPrice: 1799.99, stock: 12, maxStock: 30, rating: 4.7, reviewCount: 432, brand: 'HomeStyle', approved: true, sales: 65 },
  { name: 'Wooden Dining Table', description: 'Solid oak dining table for 6. Modern farmhouse design.', category: 'Tables', imageUrl: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=800&q=80', basePrice: 899.99, currentPrice: 799.99, minPrice: 699.99, maxPrice: 1099.99, stock: 18, maxStock: 40, rating: 4.6, reviewCount: 287, brand: 'WoodCraft', approved: true, sales: 95 },
  { name: 'KitchenAid Stand Mixer', description: 'Professional 5Qt stand mixer with 10 speeds.', category: 'Appliances', imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80', basePrice: 449.99, currentPrice: 399.99, minPrice: 349.99, maxPrice: 549.99, stock: 35, maxStock: 80, rating: 4.8, reviewCount: 1876, brand: 'KitchenAid', approved: true, sales: 420 },
  { name: 'Lodge Cast Iron Skillet', description: 'Pre-seasoned 12-inch cast iron skillet for any stovetop.', category: 'Cookware', imageUrl: 'https://images.unsplash.com/photo-1606914501449-5a96b6ce24ca?w=800&q=80', basePrice: 49.99, currentPrice: 44.99, minPrice: 34.99, maxPrice: 59.99, stock: 95, maxStock: 150, rating: 4.9, reviewCount: 8932, brand: 'Lodge', approved: true, sales: 2100 },
  { name: 'Corelle Dinnerware Set 16pc', description: 'Lightweight chip-resistant dinnerware set for 4.', category: 'Dinnerware', imageUrl: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=800&q=80', basePrice: 79.99, currentPrice: 69.99, minPrice: 59.99, maxPrice: 99.99, stock: 75, maxStock: 120, rating: 4.5, reviewCount: 3241, brand: 'Corelle', approved: true, sales: 760 },
  { name: 'North Face Puffer Jacket', description: '550-fill down jacket with waterproof shell for cold weather.', category: 'Jackets', imageUrl: 'https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=800&q=80', basePrice: 299.99, currentPrice: 249.99, minPrice: 219.99, maxPrice: 349.99, stock: 55, maxStock: 100, rating: 4.7, reviewCount: 1543, brand: 'North Face', approved: true, sales: 380 },
  { name: 'Yoga Mat Premium', description: 'Extra thick 6mm yoga mat with alignment lines and non-slip surface.', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80', basePrice: 79.99, currentPrice: 69.99, minPrice: 54.99, maxPrice: 94.99, stock: 85, maxStock: 150, rating: 4.6, reviewCount: 2134, brand: 'Gaiam', approved: true, sales: 560 },
  { name: 'Dyson V15 Cordless Vacuum', description: 'Most powerful Dyson cordless vacuum with laser dust detection.', category: 'Appliances', imageUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80', basePrice: 749.99, currentPrice: 699.99, minPrice: 599.99, maxPrice: 849.99, stock: 28, maxStock: 60, rating: 4.8, reviewCount: 987, brand: 'Dyson', approved: true, sales: 210 },
  { name: 'Google Pixel 8 Pro', description: 'Best-in-class camera and 7 years of Android updates.', category: 'Smartphones', imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&q=80', basePrice: 999.99, currentPrice: 899.99, minPrice: 799.99, maxPrice: 1099.99, stock: 40, maxStock: 100, rating: 4.6, reviewCount: 654, brand: 'Google', approved: true, sales: 195 },
  { name: 'Adidas Ultraboost 23', description: 'Ultimate running shoe with Boost midsole for energy return.', category: 'Shoes', imageUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80', basePrice: 189.99, currentPrice: 169.99, minPrice: 149.99, maxPrice: 209.99, stock: 88, maxStock: 150, rating: 4.7, reviewCount: 2876, brand: 'Adidas', approved: true, sales: 720 },
  { name: 'Instant Pot Duo 7-in-1', description: 'Multi-use pressure cooker, slow cooker, rice cooker and more.', category: 'Appliances', imageUrl: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=800&q=80', basePrice: 99.99, currentPrice: 89.99, minPrice: 74.99, maxPrice: 119.99, stock: 110, maxStock: 200, rating: 4.8, reviewCount: 12543, brand: 'Instant Pot', approved: true, sales: 3200 },
  { name: 'Velvet 3-Seat Sofa', description: 'Mid-century modern velvet sofa. Easy assembly.', category: 'Sofas', imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80', basePrice: 799.99, currentPrice: 699.99, minPrice: 599.99, maxPrice: 999.99, stock: 20, maxStock: 45, rating: 4.4, reviewCount: 312, brand: 'HomePlus', approved: true, sales: 78 },
  { name: 'Columbia Fleece Jacket', description: 'Cozy fleece with full-zip design and zippered pockets.', category: 'Jackets', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80', basePrice: 119.99, currentPrice: 99.99, minPrice: 84.99, maxPrice: 139.99, stock: 67, maxStock: 120, rating: 4.5, reviewCount: 876, brand: 'Columbia', approved: true, sales: 290 },
  { name: 'Resistance Bands Set', description: 'Set of 5 resistance bands for home workouts. Various resistance levels.', category: 'Sports', imageUrl: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&q=80', basePrice: 29.99, currentPrice: 24.99, minPrice: 19.99, maxPrice: 39.99, stock: 200, maxStock: 300, rating: 4.5, reviewCount: 4321, brand: 'FitLife', approved: true, sales: 1800 },
  { name: 'OnePlus 12 Smartphone', description: 'Flagship killer with Snapdragon 8 Gen 3 and Hasselblad camera.', category: 'Smartphones', imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80', basePrice: 799.99, currentPrice: 749.99, minPrice: 649.99, maxPrice: 899.99, stock: 50, maxStock: 100, rating: 4.5, reviewCount: 432, brand: 'OnePlus', approved: true, sales: 165 },
];

async function main() {
  console.log('Seeding products...');

  // Check if products already exist
  const existingCount = await prisma.product.count();
  if (existingCount > 0) {
    console.log(`Database already has ${existingCount} products. Skipping seed.`);
    await prisma.$disconnect();
    return;
  }

  await prisma.product.createMany({ data: seedProducts });
  const count = await prisma.product.count();
  console.log(`✅ Created ${count} products with images.`);

  await prisma.pricingConfig.create({
    data: {
      stockWeight: 0.3, demandWeight: 0.4, competitorWeight: 0.3,
      maxIncreasePercent: 20, maxDecreasePercent: 15, minProfitMargin: 15,
    }
  });

  console.log('Seeding finished.');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
