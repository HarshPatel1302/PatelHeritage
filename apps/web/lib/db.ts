import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

// Next.js dev server hot-reloads modules; without the global cache we would open
// a new connection pool on every reload and exhaust Postgres.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  }
  // Prisma 7 requires a driver adapter for direct TCP connections.
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

function client(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Connects on first use rather than on import.
 *
 * Importing a module should not be able to throw or open a socket. Building the
 * client eagerly meant that any file importing something that transitively
 * reached this one — a unit test for a pure function, for instance — died with
 * "DATABASE_URL is not set" before running a single line.
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property, receiver) {
    return Reflect.get(client(), property, receiver);
  },
  has(_target, property) {
    return property in client();
  },
});
