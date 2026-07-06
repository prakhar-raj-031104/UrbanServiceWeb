import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signToken(user) {
  return jwt.sign({ sub: user.id, name: user.name }, SECRET, { expiresIn: '30d' });
}

// Strict guard — 401 when no valid user token.
export async function userAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: 'Login required' });
    const payload = jwt.verify(token, SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: 'Login required' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Session expired — please log in again' });
  }
}
