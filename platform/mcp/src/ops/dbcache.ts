import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function dbCacheGet<T>(key: string): Promise<T | null> {
  try {
    const entry = await prisma.apiCache.findUnique({
      where: { key },
    });

    if (!entry) {
      process.stderr.write(`[cache] MISS: ${key}\n`);
      return null;
    }

    if (new Date() > entry.expiresAt) {
      await prisma.apiCache.delete({ where: { key } }).catch(() => {});
      process.stderr.write(`[cache] EXPIRED: ${key}\n`);
      return null;
    }

    process.stderr.write(`[cache] HIT: ${key}\n`);
    return entry.value as T;
  } catch (err: any) {
    process.stderr.write(`[cache] ERROR on get: ${err.message}\n`);
    return null;
  }
}

export async function dbCacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

    await prisma.apiCache.upsert({
      where: { key },
      update: {
        value: value as any,
        expiresAt,
      },
      create: {
        key,
        value: value as any,
        expiresAt,
      },
    });
    process.stderr.write(`[cache] SET: ${key} (TTL: ${ttlSeconds}s)\n`);
  } catch (err: any) {
    process.stderr.write(`[cache] ERROR on set: ${err.message}\n`);
  }
}
