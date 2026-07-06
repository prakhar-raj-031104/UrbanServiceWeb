import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { signToken, userAuth } from '../middleware/userAuth.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(10).max(15),
  address: z.string().min(4),
  password: z.string().min(6),
});

function publicUser(u) {
  return { id: u.id, name: u.name, phone: u.phone, address: u.address };
}

// POST /api/auth/signup
router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const phone = data.phone.replace(/[^\d+]/g, '');
    const existing = await prisma.user.findUnique({ where: { phone } });
    if (existing) return res.status(409).json({ error: 'An account with this number already exists — log in instead' });

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name.trim(), phone, address: data.address.trim(), passwordHash },
    });
    res.status(201).json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(422).json({ error: err.issues[0]?.message || 'Invalid details' });
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { phone, password } = req.body;
    const clean = String(phone || '').replace(/[^\d+]/g, '');
    const user = await prisma.user.findUnique({ where: { phone: clean } });
    if (!user || !(await bcrypt.compare(String(password || ''), user.passwordHash)))
      return res.status(401).json({ error: 'Wrong number or password' });
    res.json({ token: signToken(user), user: publicUser(user) });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', userAuth, (req, res) => res.json({ user: publicUser(req.user) }));

// GET /api/auth/me/requests — the dashboard feed: all my requests, newest first
router.get('/me/requests', userAuth, async (req, res, next) => {
  try {
    const requests = await prisma.serviceRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { name: true, category: true, imageUrl: true, basePrice: true, hourlyRate: true } },
        staff: { select: { name: true, phone: true, photoUrl: true, rating: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

export default router;
