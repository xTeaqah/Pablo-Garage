import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

export async function checkRateLimit(key: string): Promise<{
  allowed: boolean;
  retryAfterSeconds?: number;
}> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + WINDOW_MS);

  const existing = await prisma.loginAttempt.findUnique({
    where: { key },
  });

  if (!existing || existing.resetAt <= now) {
    await prisma.loginAttempt.upsert({
      where: { key },
      update: { count: 1, resetAt },
      create: { key, count: 1, resetAt },
    });
    return { allowed: true };
  }

  if (existing.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil(
        (existing.resetAt.getTime() - now.getTime()) / 1000
      ),
    };
  }

  await prisma.loginAttempt.update({
    where: { key },
    data: { count: existing.count + 1 },
  });

  return { allowed: true };
}

export async function clearRateLimit(key: string): Promise<void> {
  await prisma.loginAttempt.deleteMany({ where: { key } });
}

/** Remove expired attempt records (housekeeping). */
export async function pruneExpiredLoginAttempts(): Promise<void> {
  await prisma.loginAttempt.deleteMany({
    where: { resetAt: { lt: new Date() } },
  });
}
