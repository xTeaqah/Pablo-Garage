import bcrypt from "bcryptjs";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

const BCRYPT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function getStoredCredentials(): Promise<{
  adminUsername: string;
  passwordHash: string;
}> {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
    select: { adminUsername: true, passwordHash: true },
  });
  return {
    adminUsername: settings?.adminUsername ?? "",
    passwordHash: settings?.passwordHash ?? "",
  };
}

export async function setStoredPasswordHash(hash: string): Promise<void> {
  await prisma.settings.upsert({
    where: { id: "default" },
    update: { passwordHash: hash },
    create: { id: "default", passwordHash: hash },
  });
}

async function bootstrapCredentials(): Promise<{
  adminUsername: string;
  passwordHash: string;
}> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME?.trim() || "Pablo";

  if (!adminPassword) {
    throw new Error(
      "No password configured. Set ADMIN_PASSWORD in .env or run db:seed."
    );
  }

  const passwordHash = await hashPassword(adminPassword);
  await prisma.settings.upsert({
    where: { id: "default" },
    update: { adminUsername, passwordHash },
    create: { id: "default", adminUsername, passwordHash },
  });

  return { adminUsername, passwordHash };
}

/** Resolve credentials from DB, or bootstrap from env on first use. */
export async function resolveCredentials(): Promise<{
  adminUsername: string;
  passwordHash: string;
}> {
  const stored = await getStoredCredentials();
  if (stored.passwordHash) return stored;
  return bootstrapCredentials();
}

export async function authenticatePassword(password: string): Promise<boolean> {
  const { passwordHash } = await resolveCredentials();
  return verifyPassword(password, passwordHash);
}

export async function authenticateCredentials(
  username: string,
  password: string
): Promise<boolean> {
  const { adminUsername, passwordHash } = await resolveCredentials();
  if (!safeCompare(username.trim(), adminUsername)) return false;
  return verifyPassword(password, passwordHash);
}

export function validateNewPassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters.";
  }
  if (password.length > 128) {
    return "Password must be 128 characters or fewer.";
  }
  return null;
}
