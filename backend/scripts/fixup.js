// Idempotent production data fixes — runs on every deploy (see render.yaml).
// Safe to run repeatedly.
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Broken external image → bundled asset served by the frontend
  const r = await prisma.service.updateMany({
    where: { slug: 'utensil-dishwashing', imageUrl: { contains: 'unsplash' } },
    data: { imageUrl: '/img/dishwashing.jpg' },
  });
  if (r.count) console.log(`[fixup] dishwashing image updated (${r.count})`);

  // Shimoga pricing: cleaning ₹239/hr (flat ₹599 above 3h + ₹149 first-hour promo live in code)
  const p2 = await prisma.service.updateMany({
    where: { category: 'CLEANING', hourlyRate: { not: 239 } },
    data: { hourlyRate: 239 },
  });
  if (p2.count) console.log(`[fixup] cleaning rate set to 239/hr (${p2.count})`);

  // Sweet Making service (Gajar ka Halwa & more)
  await prisma.service.upsert({
    where: { slug: 'sweet-making' },
    update: {},
    create: {
      slug: 'sweet-making', name: 'Sweet Making', category: 'COOKING',
      description: 'Traditional homemade sweets — Gajar ka Halwa, ladoos, barfi and festive specials, prepared fresh and hygienically in your kitchen.',
      imageUrl: '/img/sweets.jpg', basePrice: 199, hourlyRate: 249,
    },
  });
}

main()
  .catch((e) => console.error('[fixup]', e.message))
  .finally(() => prisma.$disconnect());
