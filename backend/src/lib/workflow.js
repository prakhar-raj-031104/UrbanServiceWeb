// Shared request-lifecycle helpers used by both admin and customer routes.
import { prisma } from './prisma.js';
import { computeBill } from './cost.js';

export async function logEvent(requestId, type, message) {
  await prisma.requestEvent.create({ data: { requestId, type, message } });
}

// Is this the user's first booking? (no other request of theirs was ever completed
// or created before this one — promo applies to the very first request)
export async function isFirstBooking(userId, requestId) {
  if (!userId) return false;
  const earlier = await prisma.serviceRequest.count({
    where: { userId, id: { not: requestId } },
  });
  return earlier === 0;
}

export async function startWork(request, by) {
  const updated = await prisma.serviceRequest.update({
    where: { id: request.id },
    data: { status: 'IN_PROGRESS', startedAt: new Date() },
  });
  await logEvent(request.id, 'STARTED', `Work started (marked by ${by}) at ${updated.startedAt.toLocaleString()}`);
  return updated;
}

export async function completeWork(request, by) {
  const completedAt = new Date();
  const first = await isFirstBooking(request.userId, request.id);
  const { cost, durationMins } = computeBill({
    hourlyRate: request.service.hourlyRate,
    startedAt: request.startedAt,
    completedAt,
    isFirstBooking: first,
  });

  const updated = await prisma.serviceRequest.update({
    where: { id: request.id },
    data: { status: 'COMPLETED', completedAt, estimatedCost: cost, durationMins },
  });

  if (request.staffId) {
    await prisma.staff.update({
      where: { id: request.staffId },
      data: { isAvailable: true, jobsDone: { increment: 1 } },
    });
  }
  await logEvent(
    request.id,
    'COMPLETED',
    `Completed in ${durationMins} min · bill ₹${cost}${first ? ' (first-booking offer applied)' : ''} — marked by ${by}`
  );
  return updated;
}
