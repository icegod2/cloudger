import { PrismaClient as PrismaClientAuth } from '@prisma/client-auth';
import { PrismaClient as PrismaClientApp } from '@prisma/client-app';

// --- Auth Client (Singleton) ---
const globalForPrisma = globalThis as unknown as {
  prismaAuth: PrismaClientAuth | undefined;
};

export const prismaAuth = globalForPrisma.prismaAuth ?? new PrismaClientAuth({
  log: ['warn', 'error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prismaAuth = prismaAuth;

// --- App Client (Dynamic Router) ---
const appClients: Record<string, PrismaClientApp> = {};

/**
 * Returns a Prisma Client connected to the specific Shard DB.
 * Uses a cached connection if available.
 */
export const getPrismaApp = (shardId: number): PrismaClientApp => {
  const key = `shard_${shardId}`;
  
  if (!appClients[key]) {
      const dbUrl = process.env[`DATABASE_URL_SHARD_${shardId}`];
      
      if (!dbUrl) {
          throw new Error(`Configuration Error: DATABASE_URL_SHARD_${shardId} is not defined in environment variables.`);
      }
      
      appClients[key] = new PrismaClientApp({
          datasources: {
              db: {
                  url: dbUrl,
              },
          },
          log: ['warn', 'error'],
      });
  }
  
  return appClients[key];
};

/**
 * Helper to get the correct DB client for a given user.
 * If shardId is provided (e.g. from Session), it skips the Auth DB lookup.
 */
export const getUserDb = async (userId: number, shardId?: number) => {
    // Optimization: If shardId is already known (e.g. from JWT/Session), use it.
    if (typeof shardId === 'number') {
        return getPrismaApp(shardId);
    }

    // Fallback: Query Auth DB to find shardId
    const user = await prismaAuth.user.findUnique({
        where: { id: userId },
        select: { shardId: true }
    });

    if (!user) {
        throw new Error(`User ${userId} not found in Auth DB.`);
    }

    return getPrismaApp(user.shardId);
};
