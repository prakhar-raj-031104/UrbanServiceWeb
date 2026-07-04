import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { notifyNewRequest } from '../services/whatsapp.js';
import { bus } from '../lib/bus.js';

const router = Router();

const createSchema = z.object({
  serviceId: z.string().min(1),
  customerName: z.string().min(2),
  customerPhone: z.string().min(6),
  address: z.string().min(4),
  notes: z.string().optional(),
  scheduledFor: z.string().datetime().optional(),
});

function shortCode() {
  return 'UR-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}

// POST /api/requests  — customer submits a service request.
// Flow: save to DB -> create timeline event -> fire WhatsApp notification.
router.post('/', async (req, res, next) => {
  try {
    const data = createSchema.parse(req.body);

    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service || !service.isActive) return res.status(400).json({ error: 'Invalid service' });

    const request = await prisma.serviceRequest.create({
      data: {
        code: shortCode(),
        serviceId: data.serviceId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        address: data.address,
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
      whatsapp: notify,
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(422).json({ error: 'Validation', issues: err.issues });
    next(err);
  }
});

// GET /api/requests/:code  — customer can track their request + assigned staff.
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
