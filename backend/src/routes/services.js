import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/services?q=&category=&available=
// Public catalogue + search. Returns services with available-staff counts.
router.get('/', async (req, res, next) => {
  try {
    const { q, category, available } = req.query;

    const where = { isActive: true };
    if (category) where.category = String(category).toUpperCase();
    if (q) {
      where.OR = [
        { name: { contains: String(q), mode: 'insensitive' } },
        { description: { contains: String(q), mode: 'insensitive' } },
      ];
    }

    const services = await prisma.service.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        staff: {
          select: { id: true, name: true, photoUrl: true, rating: true, jobsDone: true, isAvailable: true },
        },
      },
    });

    let result = services.map((s) => {
      const availableStaff = s.staff.filter((st) => st.isAvailable);
      return {
        ...s,
        staffCount: s.staff.length,
        availableStaffCount: availableStaff.length,
        available: availableStaff.length > 0,
      };
    });

    if (available === 'true') result = result.filter((s) => s.available);

    res.json({ services: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/services/:slug  — single service with full staff profiles
router.get('/:slug', async (req, res, next) => {
  try {
    const service = await prisma.service.findUnique({
      where: { slug: req.params.slug },
      include: { staff: true },
    });
    if (!service) return res.status(404).json({ error: 'Service not found' });
    res.json({ service });
  } catch (err) {
    next(err);
  }
});

export default router;
