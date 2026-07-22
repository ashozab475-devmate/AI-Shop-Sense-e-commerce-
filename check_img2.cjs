const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();
async function main() {
  const products = await prisma.product.findMany({ select: { name: true, imageUrl: true } });
  let ok = 0, missing = 0, nullCount = 0;
  for (const p of products) {
    if (!p.imageUrl) { nullCount++; continue; }
    const localPath = path.join('public', p.imageUrl.replace(/^\//, ''));
    if (fs.existsSync(localPath)) ok++;
    else { missing++; console.log('MISSING:', p.name, '->', p.imageUrl); }
  }
  console.log(`OK: ${ok}, Missing: ${missing}, Null: ${nullCount}`);
  await prisma.$disconnect();
}
main().catch(console.error);
