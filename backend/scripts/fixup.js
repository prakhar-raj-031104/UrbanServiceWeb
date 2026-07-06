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
}

main()
  .catch((e) => console.error('[fixup]', e.message))
  .finally(() => prisma.$disconnect());
