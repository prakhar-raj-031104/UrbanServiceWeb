// Cost estimation from work duration.
// basePrice acts as the MINIMUM BILL for a job; hourlyRate bills actual time.
//   estimate = max(basePrice, hourlyRate × hours-worked)
// e.g. Cleaning in Shimoga: ₹249/hr with a ₹500 minimum →
//   1h = ₹500 (minimum), 2h = ₹500, 3h = ₹747, 4h = ₹996.

export function estimateCost(service, startedAt, completedAt) {
  if (!startedAt || !completedAt) return { cost: null, durationMins: null };
  const durationMins = Math.max(1, Math.round((new Date(completedAt) - new Date(startedAt)) / 60000));
  const billedHours = Math.max(0.5, durationMins / 60);
  const timeCost = service.hourlyRate * billedHours;
  const cost = Math.round(Math.max(service.basePrice, timeCost) * 100) / 100;
  return { cost, durationMins };
}
