import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notifyNewRequest } from '../services/whatsapp.js';
import { bus } from '../lib/bus.js';
import { userAuth } from '../middleware/userAuth.js';
import { startWork, completeWork, logEvent } from '../lib/workflow.js';

const router = Router();

const createSchema = z.object({
  serviceId: z.string().min(1),
  scheduledFor: z.string().datetime().optional(),
  notes: z.string().optional(),
  address: z.string().optional(), // override; defaults to the profile address
});

function shortCode() {
  return 'UR-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// POST /api/requests — logged-in customers only.
// Name/phone come from the account; address defaults to the saved one.
router.post('/', userAuth, async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service || !service.isActive) return res.status(400).json({ error: 'Invalid service' });

    const request = await prisma.serviceRequest.create({
      data: {
        code: shortCode(),
        serviceId: data.serviceId,
        userId: req.user.id,
        customerName: req.user.name,
        customerPhone: req.user.phone,
        address: (data.address || req.user.address).trim(),
        notes: data.notes,
        scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : null,
        events: {
          create: { type: 'CREATED', message: `Request created for ${service.name}` },
        },
      },
    });

    // Push to any live admin-panel connections immediately (SSE).
    bus.emit('request:new', {
      id: request.id,
      code: request.code,
      serviceName: service.name,
      customerName: request.customerName,
      customerPhone: request.customerPhone,
      address: request.address,
      createdAt: request.createdAt,
    });

    // Fire-and-await the WhatsApp notification but never fail the request on it.
    const notify = await notifyNewRequest(request, service);

    res.status(201).json({
      request: { id: request.id, code: request.code, status: request.status },
      whatsapp: { ok: notify.ok },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(422).json({ error: 'Validation', issues: err.issues });
    next(err);
  }
});

// ── customer lifecycle controls (dashboard buttons) ──
async function ownRequest(req, res) {
  const request = await prisma.serviceRequest.findUnique({
    where: { id: req.params.id },
    include: { service: true },
  });
  if (!request || request.userId !== req.user.id) {
    res.status(404).json({ error: 'Request not found' });
    return null;
  }
  return request;
}

// POST /api/requests/:id/start — customer marks "staff has arrived, work started"
router.post('/:id/start', userAuth, async (req, res, next) => {
  try {
    const request = await ownRequest(req, res);
    if (!request) return;
    if (request.status !== 'ASSIGNED')
      return res.status(400).json({ error: 'Work can start once a professional is assigned' });
    const updated = await startWork(request, 'customer');
    res.json({ request: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/requests/:id/complete — customer marks the job done → bill generated
router.post('/:id/complete', userAuth, async (req, res, next) => {
  try {
    const request = await ownRequest(req, res);
    if (!request) return;
    if (request.status !== 'IN_PROGRESS' || !request.startedAt)
      return res.status(400).json({ error: 'Work has not been started yet' });
    const updated = await completeWork(request, 'customer');
    res.json({ request: updated });
  } catch (err) {
    next(err);
  }
});

// POST /api/requests/:id/review — rate a completed job (1–5 + optional text).
// Updates the assigned staff member's running average rating.
router.post('/:id/review', userAuth, async (req, res, next) => {
  try {
    const request = await ownRequest(req, res);
    if (!request) return;
    if (request.status !== 'COMPLETED') return res.status(400).json({ error: 'You can review after completion' });
    if (request.rating) return res.status(400).json({ error: 'Already reviewed — thank you!' });

    const rating = Math.min(5, Math.max(1, parseInt(req.body.rating, 10) || 0));
    if (!rating) return res.status(422).json({ error: 'Pick a rating from 1 to 5' });
    const text = (req.body.review || '').trim().slice(0, 500) || null;

    const updated = await prisma.serviceRequest.update({
      where: { id: request.id },
      data: { rating, review: text, reviewedAt: new Date() },
    });

    // refresh the staff member's average rating from all their reviews
    if (request.staffId) {
      const agg = await prisma.serviceRequest.aggregate({
        where: { staffId: request.staffId, rating: { not: null } },
        _avg: { rating: true },
      });
      if (agg._avg.rating) {
        await prisma.staff.update({
          where: { id: request.staffId },
          data: { rating: Math.round(agg._avg.rating * 10) / 10 },
        });
      }
    }
    await logEvent(request.id, 'REVIEWED', `Customer rated ${rating}★${text ? ` — “${text}”` : ''}`);
    res.json({ request: updated });
  } catch (err) {
    next(err);
  }
});

// GET /api/requests/:code — public tracking by code (guest-friendly).
router.get('/:code', async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { code: req.params.code },
      include: {
        service: { select: { name: true, category: true } },
        staff: { select: { name: true, phone: true, photoUrl: true, rating: true } },
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json({ request });
  } catch (err) {
    next(err);
  }
});

export default router;
