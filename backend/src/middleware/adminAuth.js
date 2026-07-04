// Simple bearer-token guard for admin routes.
// The admin panel stores the token and sends it as `Authorization: Bearer <token>`
// or `x-admin-token`. For production, swap this for real auth (JWT/session).

export function adminAuth(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  const header = req.headers.authorization || '';
  // `?token=` is accepted for SSE (EventSource cannot send headers).
  const token = header.startsWith('Bearer ')
    ? header.slice(7)
    : req.headers['x-admin-token'] || req.query.token;
  if (!expected || token !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
