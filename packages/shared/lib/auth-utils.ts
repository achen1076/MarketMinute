import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * Hash a password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

/**
 * Check if a user exists and which auth method they use
 */
export async function checkUserAuthMethod(
  email: string
): Promise<"google" | "credentials" | "none"> {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  });

  if (!user) {
    return "none";
  }

  // Check if user has Google account
  const hasGoogle = user.accounts.some(
    (account) => account.provider === "google"
  );
  if (hasGoogle) {
    return "google";
  }

  // Check if user has password (credentials)
  if (user.password) {
    return "credentials";
  }

  return "none";
}
