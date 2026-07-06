import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

// GET /api/reviews — recent public reviews for the homepage (rating ≥ 4 shown first)
router.get('/', async (_req, res, next) => {
  try {
    const rows = await prisma.serviceRequest.findMany({
      where: { rating: { not: null } },
      orderBy: [{ rating: 'desc' }, { reviewedAt: 'desc' }],
      take: 9,
      select: {
        id: true,
        rating: true,
        review: true,
        reviewedAt: true,
        customerName: true,
        service: { select: { name: true, category: true } },
      },
    });
    const agg = await prisma.serviceRequest.aggregate({
      where: { rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    });
    res.json({
      reviews: rows,
      average: agg._avg.rating ? Math.round(agg._avg.rating * 10) / 10 : null,
      count: agg._count.rating,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
