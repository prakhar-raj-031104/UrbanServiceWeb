import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { estimateCost } from '../lib/cost.js';
import { bus } from '../lib/bus.js';

const router = Router();
router.use(adminAuth);

// GET /api/admin/events — SSE stream: pushes new requests to the panel instantly.
router.get('/events', (req, res) => {
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.flushHeaders();
  res.write('event: hello\ndata: {}\n\n');

  const onNew = (payload) => {
    res.write(`event: request:new\ndata: ${JSON.stringify(payload)}\n\n`);
  };
  bus.on('request:new', onNew);

  // keep-alive ping every 25s so proxies don't drop the connection
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(ping);
    bus.off('request:new', onNew);
  });
});

async function logEvent(requestId, type, message) {
  await prisma.requestEvent.create({ data: { requestId, type, message } });
}

// GET /api/admin/requests?status=  — all requests for the admin dashboard
router.get('/requests', async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = status ? { status: String(status).toUpperCase() } : {};
    const requests = await prisma.serviceRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        service: true,
        staff: true,
        events: { orderBy: { createdAt: 'asc' } },
      },
    });
    res.json({ requests });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats — quick dashboard counters
router.get('/stats', async (_req, res, next) => {
  try {
    const [pending, inProgress, completed, staff] = await Promise.all([
      prisma.serviceRequest.count({ where: { status: 'PENDING' } }),
      prisma.serviceRequest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.serviceRequest.count({ where: { status: 'COMPLETED' } }),
      prisma.staff.count({ where: { isAvailable: true } }),
    ]);
    res.json({ pending, inProgress, completed, availableStaff: staff });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/staff?serviceId=  — staff pool, optionally for a service
router.get('/staff', async (req, res, next) => {
  try {
    const { serviceId } = req.query;
    const where = serviceId ? { services: { some: { id: String(serviceId) } } } : {};
    const staff = await prisma.staff.findMany({ where, orderBy: { name: 'asc' }, include: { services: true } });
    res.json({ staff });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/requests/:id/accept
router.post('/requests/:id/accept', async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'ACCEPTED', acceptedAt: new Date() },
    });
    await logEvent(request.id, 'ACCEPTED', 'Request accepted by admin');
    res.json({ request });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/requests/:id/assign   body: { staffId }
// Connects a stored staff profile (name/phone/photo) to the customer.
router.post('/requests/:id/assign', async (req, res, next) => {
  try {
    const { staffId } = req.body;
    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) return res.status(400).json({ error: 'Invalid staff' });

    const request = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: {
        staffId,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
      include: { staff: true },
    });
    // mark staff busy
    await prisma.staff.update({ where: { id: staffId }, data: { isAvailable: false } });
    await logEvent(request.id, 'ASSIGNED', `Assigned to ${staff.name} (${staff.phone})`);
    res.json({ request });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/requests/:id/start  — staff reached workplace; mark work start
router.post('/requests/:id/start', async (req, res, next) => {
  try {
    const request = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
    await logEvent(request.id, 'STARTED', `Work started at ${request.startedAt.toISOString()}`);
    res.json({ request });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/requests/:id/complete  — mark done + generate estimated cost
router.post('/requests/:id/complete', async (req, res, next) => {
  try {
    const existing = await prisma.serviceRequest.findUnique({
      where: { id: req.params.id },
      include: { service: true },
    });
    if (!existing) return res.status(404).json({ error: 'Request not found' });
    if (!existing.startedAt) return res.status(400).json({ error: 'Work has not been started yet' });

    const completedAt = new Date();
    const { cost, durationMins } = estimateCost(existing.service, existing.startedAt, completedAt);

    const request = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED', completedAt, estimatedCost: cost, durationMins },
    });

    // free the staff member + bump their job count
    if (existing.staffId) {
      await prisma.staff.update({
        where: { id: existing.staffId },
        data: { isAvailable: true, jobsDone: { increment: 1 } },
      });
    }
    await logEvent(request.id, 'COMPLETED', `Completed in ${durationMins} min · est. cost ₹${cost}`);
    res.json({ request });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/requests/:id/cancel
router.post('/requests/:id/cancel', async (req, res, next) => {
  try {
    const existing = await prisma.serviceRequest.findUnique({ where: { id: req.params.id } });
    const request = await prisma.serviceRequest.update({
      where: { id: req.params.id },
      data: { status: 'CANCELLED' },
    });
    if (existing?.staffId) {
      await prisma.staff.update({ where: { id: existing.staffId }, data: { isAvailable: true } });
    }
    await logEvent(request.id, 'CANCELLED', 'Request cancelled');
    res.json({ request });
  } catch (err) {
    next(err);
  }
});

export default router;
