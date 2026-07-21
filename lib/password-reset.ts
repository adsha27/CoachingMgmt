import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const RESET_TOKEN_TTL_MINUTES = 60;

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

// Issues a single-use reset token for a user. Only the SHA-256 hash is stored;
// the raw token goes out in the emailed link and is never persisted. Any prior
// unused tokens for the user are invalidated so only the latest link works.
export async function createResetToken(userId: number): Promise<string> {
  const raw = crypto.randomBytes(32).toString("hex");
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId, usedAt: null } }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60 * 1000),
      },
    }),
  ]);
  return raw;
}

// Atomically consumes a token: returns the userId if the token is valid
// (exists, unused, unexpired) and marks it used in the same step so it can't be
// replayed. Returns null otherwise. The updateMany guard on usedAt=null makes
// concurrent double-submits race-safe — only the first wins.
export async function consumeResetToken(raw: string): Promise<number | null> {
  if (!raw) return null;
  const token = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(raw) } });
  if (!token || token.usedAt || token.expiresAt < new Date()) return null;

  const claimed = await prisma.passwordResetToken.updateMany({
    where: { id: token.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return null; // lost the race — already consumed

  return token.userId;
}
