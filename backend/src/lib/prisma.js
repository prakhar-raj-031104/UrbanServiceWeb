import { PrismaClient } from '@prisma/client';

// Single shared Prisma client. `--watch` can re-import; guard against
// exhausting the connection pool in dev by caching on globalThis.
const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['warn', 'error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
