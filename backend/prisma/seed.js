import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const services = [
  {
    slug: 'home-cooking',
    name: 'Home Cooking',
    category: 'COOKING',
    description: 'Experienced cooks prepare fresh, hygienic meals in your kitchen — daily meals, special occasions or meal prep.',
    imageUrl: 'https://images.unsplash.com/photo-1556909212-d5b604d0c90d?w=800&q=80',
    basePrice: 149,
    hourlyRate: 249,
  },
  {
    slug: 'party-catering-cook',
    name: 'Party Catering Cook',
    category: 'COOKING',
    description: 'On-demand chefs for gatherings and parties. Multi-cuisine, custom menus, cooked live at your place.',
    imageUrl: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800&q=80',
    basePrice: 299,
    hourlyRate: 399,
  },
  {
    slug: 'laundry-washing',
    name: 'Laundry & Washing',
    category: 'WASHING',
    description: 'Wash, dry and fold service. Pickup and drop-off, delicate care and same-day options available.',
    imageUrl: 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80',
    basePrice: 99,
    hourlyRate: 149,
  },
  {
    slug: 'utensil-dishwashing',
    name: 'Dishwashing & Utensils',
    category: 'WASHING',
    description: 'Reliable helpers for daily dish washing and kitchen cleanup — one-time or recurring.',
    imageUrl: '/img/dishwashing.jpg',
    basePrice: 79,
    hourlyRate: 129,
  },
  {
    slug: 'deep-home-cleaning',
    name: 'Deep Home Cleaning',
    category: 'CLEANING',
    description: 'Top-to-bottom deep cleaning — floors, bathrooms, kitchen, dusting and sanitisation by trained staff.',
    imageUrl: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    basePrice: 500,
    hourlyRate: 239,
  },
  {
    slug: 'bathroom-cleaning',
    name: 'Bathroom Cleaning',
    category: 'CLEANING',
    description: 'Deep bathroom sanitisation — descaling, disinfecting and stain removal for a spotless finish.',
    imageUrl: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=800&q=80',
    basePrice: 500,
    hourlyRate: 239,
  },
  {
    slug: 'sofa-carpet-cleaning',
    name: 'Sofa & Carpet Cleaning',
    category: 'CLEANING',
    description: 'Machine shampooing and stain extraction for sofas, carpets and mattresses — fresh, allergen-free fabric.',
    imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80',
    basePrice: 500,
    hourlyRate: 239,
  },
  {
    slug: 'kitchen-deep-clean',
    name: 'Kitchen Deep Clean',
    category: 'CLEANING',
    description: 'Degreasing of chimney, stove, tiles and cabinets — a hygienic, sparkling kitchen ready for cooking.',
    imageUrl: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?w=800&q=80',
    basePrice: 500,
    hourlyRate: 239,
  },
  {
    slug: 'ironing-folding',
    name: 'Ironing & Folding',
    category: 'WASHING',
    description: 'Crisp, wrinkle-free clothes — steam ironing, folding and wardrobe organisation at your home.',
    imageUrl: 'https://images.unsplash.com/photo-1489274495757-95c7c837b101?w=800&q=80',
    basePrice: 89,
    hourlyRate: 119,
  },
  {
    slug: 'tiffin-meal-prep',
    name: 'Tiffin & Meal Prep',
    category: 'COOKING',
    description: 'Weekly meal prep and tiffin service — balanced, home-style meals portioned and packed for your week.',
    imageUrl: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
    basePrice: 199,
    hourlyRate: 269,
  },
  {
    slug: 'sweet-making',
    name: 'Sweet Making',
    category: 'COOKING',
    description: 'Traditional homemade sweets — Gajar ka Halwa, ladoos, barfi and festive specials, prepared fresh and hygienically in your kitchen.',
    imageUrl: '/img/sweets.jpg',
    basePrice: 199,
    hourlyRate: 249,
  },
  {
    slug: 'full-home-cleaning',
    name: 'Full Home Package',
    category: 'CLEANING',
    description: 'The complete package — every room, balcony and window. Ideal for move-ins, festivals and spring cleaning.',
    imageUrl: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&q=80',
    basePrice: 500,
    hourlyRate: 239,
  },
];

const staff = [
  { name: 'Ramesh Kumar', phone: '+91 90000 11111', photoUrl: 'https://i.pravatar.cc/300?img=12', bio: 'Home chef, 8 yrs experience. North & South Indian.', rating: 4.9, jobsDone: 320, cats: ['COOKING'] },
  { name: 'Sunita Devi', phone: '+91 90000 22222', photoUrl: 'https://i.pravatar.cc/300?img=45', bio: 'Specialist in daily meals and meal prep.', rating: 4.8, jobsDone: 210, cats: ['COOKING'] },
  { name: 'Arjun Nair', phone: '+91 90000 33333', photoUrl: 'https://i.pravatar.cc/300?img=33', bio: 'Party & catering chef, multi-cuisine.', rating: 4.7, jobsDone: 145, cats: ['COOKING'] },
  { name: 'Priya Sharma', phone: '+91 90000 44444', photoUrl: 'https://i.pravatar.cc/300?img=47', bio: 'Laundry & fabric-care specialist.', rating: 4.9, jobsDone: 280, cats: ['WASHING'] },
  { name: 'Mohan Lal', phone: '+91 90000 55555', photoUrl: 'https://i.pravatar.cc/300?img=15', bio: 'Fast, thorough dishwashing & kitchen cleanup.', rating: 4.6, jobsDone: 190, cats: ['WASHING'] },
  { name: 'Deepa Iyer', phone: '+91 90000 66666', photoUrl: 'https://i.pravatar.cc/300?img=44', bio: 'Deep-cleaning lead, trained & verified.', rating: 4.9, jobsDone: 260, cats: ['CLEANING'] },
  { name: 'Vikram Singh', phone: '+91 90000 77777', photoUrl: 'https://i.pravatar.cc/300?img=51', bio: 'Bathroom & floor deep-clean expert.', rating: 4.8, jobsDone: 175, cats: ['CLEANING'] },
  { name: 'Anjali Rao', phone: '+91 90000 88888', photoUrl: 'https://i.pravatar.cc/300?img=48', bio: 'All-round home cleaning professional.', rating: 4.7, jobsDone: 130, cats: ['CLEANING', 'WASHING'] },
];

async function main() {
  console.log('🌱 Seeding…');
  // clean
  await prisma.requestEvent.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.$executeRawUnsafe('TRUNCATE "Service" CASCADE');
  await prisma.staff.deleteMany();

  const createdServices = {};
  for (const s of services) {
    const svc = await prisma.service.create({ data: s });
    createdServices[svc.category] = createdServices[svc.category] || [];
    createdServices[svc.category].push(svc);
  }

  for (const st of staff) {
    const connectServices = st.cats.flatMap((c) => (createdServices[c] || []).map((s) => ({ id: s.id })));
    await prisma.staff.create({
      data: {
        name: st.name,
        phone: st.phone,
        photoUrl: st.photoUrl,
        bio: st.bio,
        rating: st.rating,
        jobsDone: st.jobsDone,
        services: { connect: connectServices },
      },
    });
  }

  console.log(`✅ Seeded ${services.length} services and ${staff.length} staff.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
