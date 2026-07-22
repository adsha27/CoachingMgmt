import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const CODE_TTL_MINUTES = 15;
export const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

export function hashCode(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

// 6 digits, uniform. crypto.randomInt avoids the modulo bias you get from
// Math.random() * 900000, which would make some codes likelier than others.
function generateCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; reason: "cooldown"; retryAfterSeconds: number };

// Issues a fresh code, invalidating any previous unused one so only the latest
// email works. Rate-limited so the endpoint can't be used to spam an inbox.
export async function issueVerificationCode(userId: number): Promise<IssueResult> {
  const latest = await prisma.emailVerification.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  if (latest) {
    const age = (Date.now() - latest.createdAt.getTime()) / 1000;
    if (!latest.usedAt && age < RESEND_COOLDOWN_SECONDS) {
      return { ok: false, reason: "cooldown", retryAfterSeconds: Math.ceil(RESEND_COOLDOWN_SECONDS - age) };
    }
  }

  const code = generateCode();
  await prisma.$transaction([
    prisma.emailVerification.deleteMany({ where: { userId, usedAt: null } }),
    prisma.emailVerification.create({
      data: {
        userId,
        codeHash: hashCode(code),
        expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
      },
    }),
  ]);
  return { ok: true, code };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "too_many_attempts" | "incorrect" };

// Consumes a code for a specific user. Scoped by userId (taken from the
// session, never from the request body) so this can't be used to probe or
// verify somebody else's account.
export async function verifyCode(userId: number, code: string): Promise<VerifyResult> {
  const record = await prisma.emailVerification.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return { ok: false, reason: "no_code" };
  if (record.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (record.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" };

  // Constant-time compare so a wrong code can't be narrowed down by timing.
  const supplied = Buffer.from(hashCode(code.trim()));
  const expected = Buffer.from(record.codeHash);
  const match = supplied.length === expected.length && crypto.timingSafeEqual(supplied, expected);

  if (!match) {
    await prisma.emailVerification.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    const attempts = record.attempts + 1;
    return { ok: false, reason: attempts >= MAX_ATTEMPTS ? "too_many_attempts" : "incorrect" };
  }

  // Claim the code and mark the account verified together, so a double-submit
  // can't consume two codes or leave the two out of step.
  const claimed = await prisma.emailVerification.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  if (claimed.count !== 1) return { ok: false, reason: "no_code" };

  await prisma.user.update({ where: { id: userId }, data: { emailVerifiedAt: new Date() } });
  return { ok: true };
}
