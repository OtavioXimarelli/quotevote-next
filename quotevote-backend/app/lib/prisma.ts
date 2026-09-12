/**
 * Application-Level Prisma Client Singleton
 *
 * Provides a single shared PrismaClient instance for the entire application.
 * Uses globalThis caching to prevent multiple instances during development
 * hot-reloads (ts-node-dev --respawn).
 *
 * Usage:
 *   import { prisma } from '~/lib/prisma';
 *   const user = await prisma.user.findUnique({ where: { id } });
 *
 * @see https://www.prisma.io/docs/guides/performance-and-optimization/connection-management
 */

import { PrismaClient } from '@prisma/client';

// Extend globalThis for development hot-reload caching
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Shared Prisma Client instance.
 * - In production: creates a single instance per process.
 * - In development: reuses instance across hot-reloads via globalThis.
 */
export const prisma: PrismaClient = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Gracefully disconnect Prisma Client.
 * Call during application shutdown (SIGINT/SIGTERM handlers).
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
