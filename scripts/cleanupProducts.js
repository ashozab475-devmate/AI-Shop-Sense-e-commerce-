const { PrismaClient } = require('@prisma/client');
const https = require('https');

const prisma = new PrismaClient();

function checkImageUrl(url) {
    return new Promise((resolve) => {
        https.get(url, { timeout: 5000 }, (res) => {
            resolve(res.statusCode === 200);
        }).on('error', () => {
            resolve(false);
        }).on('timeout', () => {
            resolve(false);
        });
    });
}

async function cleanupProducts() {
    console.log('Fetching all products...');
    const products = await prisma.product.findMany();
    
    const failedProducts = [];
    
    for (const product of products) {
        console.log(`Checking ${product.name}...`);
        const isValid = await checkImageUrl(product.imageUrl);
        
        if (!isValid) {
            console.log(`❌ Failed: ${product.name} (${product.imageUrl})`);
            failedProducts.push(product.id);
        } else {
            console.log(`✅ Valid: ${product.name}`);
        }
    }
    
    if (failedProducts.length > 0) {
        console.log(`\nDeleting ${failedProducts.length} products with broken images...`);
        await prisma.product.deleteMany({
            where: {
                id: {
                    in: failedProducts
                }
            }
        });
        console.log('✅ Cleanup complete!');
    } else {
        console.log('\n✅ All product images are valid!');
    }
    
    await prisma.$disconnect();
}

cleanupProducts().catch((e) => {
    console.error(e);
    process.exit(1);
});
