// Billing engine — Ms Help Hub pricing (Shimoga):
//   · ₹<hourlyRate>/hr (cleaning: ₹239/hr), minimum 1 hour billed
//   · Jobs longer than 3 hours: FLAT ₹599 (one person)
//   · First-ever booking promo: first hour costs ₹149
export const FLAT_ABOVE_3H = 599;
export const FIRST_BOOKING_FIRST_HOUR = 149;

export function computeBill({ hourlyRate, startedAt, completedAt, isFirstBooking = false }) {
  if (!startedAt || !completedAt) return { cost: null, durationMins: null };
  const durationMins = Math.max(1, Math.round((new Date(completedAt) - new Date(startedAt)) / 60000));
  const hours = Math.max(1, durationMins / 60);

  let cost;
  if (hours > 3) {
    cost = FLAT_ABOVE_3H;
  } else if (isFirstBooking) {
    // promo first hour + normal rate for the remainder
    cost = FIRST_BOOKING_FIRST_HOUR + Math.max(0, hours - 1) * hourlyRate;
  } else {
    cost = hours * hourlyRate;
  }
  return { cost: Math.round(cost), durationMins };
}

// Back-compat wrapper used by the admin route.
export function estimateCost(service, startedAt, completedAt, isFirstBooking = false) {
  return computeBill({ hourlyRate: service.hourlyRate, startedAt, completedAt, isFirstBooking });
}
