import bcrypt from 'bcryptjs';
import { seedProducts } from './seed-products';
import { DEFAULTS } from '../lib/content';
import { db } from '../lib/db';

async function main() {
  for (const { reviews, ...p } of seedProducts) {
    const data = { ...p, reviewCount: reviews, badge: p.badge || null };
    await db.product.upsert({ where: { sku: p.sku }, update: {}, create: data });
  }

  // only fill missing keys, never overwrite what the admin edited
  for (const [key, value] of Object.entries(DEFAULTS)) {
    await db.siteContent.upsert({ where: { key }, update: {}, create: { key, value } });
  }

  const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  await db.user.upsert({
    where: { email: ADMIN_EMAIL.toLowerCase() },
    update: { role: 'ADMIN' },
    create: { email: ADMIN_EMAIL.toLowerCase(), name: 'Store Admin', role: 'ADMIN',
              password: await bcrypt.hash(ADMIN_PASSWORD, 12) },
  });

  console.log(`Seeded ${seedProducts.length} products, ${Object.keys(DEFAULTS).length} content keys, admin ${ADMIN_EMAIL}`);
}

main().finally(() => db.$disconnect());
