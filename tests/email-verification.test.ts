import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as sendCode } from "@/app/api/auth/verify-email/send/route";
import { POST as verifyEmail } from "@/app/api/auth/verify-email/route";
import { POST as adminReset } from "@/app/api/admin/users/[id]/send-password-reset/route";
import { issueVerificationCode, verifyCode, hashCode, MAX_ATTEMPTS } from "@/lib/email-verification";

import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

// verifyCode returns a discriminated union; tests assert on the failure arm.
const reasonOf = async (userId: number, code: string) => {
  const r = await verifyCode(userId, code);
  return r.ok ? "ok" : r.reason;
};

const P = "__test_verify__";
let seq = 0;
const uid = () => `${P}_${Date.now()}_${++seq}`;
const phone = () => `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;

const mkUser = (role: "STUDENT" | "ADMIN" | "TEACHER" = "STUDENT") =>
  prisma.user.create({
    data: { name: `${P} ${role}`, phone: phone(), email: `${uid()}@test.invalid`, role, status: "ACTIVE" },
  });

const req = (url: string, body: unknown, sid?: string) =>
  new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(sid ? { Cookie: `${SESSION_COOKIE}=${sid}` } : {}) },
    body: JSON.stringify(body),
  });

afterEach(async () => {
  await prisma.emailVerification.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.passwordResetToken.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("email verification — code lifecycle", () => {
  it("stores only a hash and verifies the correct code once", async () => {
    const u = await mkUser();
    const issued = await issueVerificationCode(u.id);
    expect(issued.ok).toBe(true);
    const code = (issued as { code: string }).code;
    expect(code).toMatch(/^\d{6}$/);

    const row = await prisma.emailVerification.findFirst({ where: { userId: u.id } });
    expect(row!.codeHash).toBe(hashCode(code));
    expect(row!.codeHash).not.toBe(code);

    expect(await verifyCode(u.id, code)).toEqual({ ok: true });
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.emailVerifiedAt).not.toBeNull();
    // single use
    expect((await verifyCode(u.id, code)).ok).toBe(false);
  });

  it("rejects an expired code", async () => {
    const u = await mkUser();
    const code = ((await issueVerificationCode(u.id)) as { code: string }).code;
    await prisma.emailVerification.updateMany({ where: { userId: u.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect(await verifyCode(u.id, code)).toEqual({ ok: false, reason: "expired" });
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.emailVerifiedAt).toBeNull();
  });

  it("locks out after too many wrong attempts", async () => {
    const u = await mkUser();
    const code = ((await issueVerificationCode(u.id)) as { code: string }).code;
    const wrong = code === "000000" ? "111111" : "000000";

    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      expect(await reasonOf(u.id, wrong)).toBe("incorrect");
    }
    expect(await reasonOf(u.id, wrong)).toBe("too_many_attempts");
    // even the RIGHT code is refused once locked out
    expect(await reasonOf(u.id, code)).toBe("too_many_attempts");
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.emailVerifiedAt).toBeNull();
  });

  it("a new code invalidates the previous one", async () => {
    const u = await mkUser();
    const first = ((await issueVerificationCode(u.id)) as { code: string }).code;
    await prisma.emailVerification.updateMany({ where: { userId: u.id }, data: { createdAt: new Date(Date.now() - 120_000) } });
    const second = ((await issueVerificationCode(u.id)) as { code: string }).code;

    expect((await verifyCode(u.id, first)).ok).toBe(false);
    expect(await verifyCode(u.id, second)).toEqual({ ok: true });
  });

  it("rate-limits resends", async () => {
    const u = await mkUser();
    expect((await issueVerificationCode(u.id)).ok).toBe(true);
    const again = await issueVerificationCode(u.id);
    expect(again.ok).toBe(false);
    expect((again as { reason: string }).reason).toBe("cooldown");
  });

  it("one user's code cannot verify another user", async () => {
    const a = await mkUser();
    const b = await mkUser();
    const codeForA = ((await issueVerificationCode(a.id)) as { code: string }).code;

    expect((await verifyCode(b.id, codeForA)).ok).toBe(false);
    expect((await prisma.user.findUnique({ where: { id: b.id } }))!.emailVerifiedAt).toBeNull();
  });
});

describe("verify-email routes", () => {
  it("requires a session", async () => {
    expect((await sendCode(req("/api/auth/verify-email/send", {}))).status).toBe(401);
    expect((await verifyEmail(req("/api/auth/verify-email", { code: "123456" }))).status).toBe(401);
  });

  it("rejects a malformed code without touching attempts", async () => {
    const u = await mkUser();
    const sid = await createSession(u.id);
    await issueVerificationCode(u.id);
    const res = await verifyEmail(req("/api/auth/verify-email", { code: "12ab" }, sid));
    expect(res.status).toBe(400);
    expect((await prisma.emailVerification.findFirst({ where: { userId: u.id } }))!.attempts).toBe(0);
  });

  it("verifies through the route with a real code", async () => {
    const u = await mkUser();
    const sid = await createSession(u.id);
    const code = ((await issueVerificationCode(u.id)) as { code: string }).code;
    const res = await verifyEmail(req("/api/auth/verify-email", { code }, sid));
    expect(res.status).toBe(200);
    expect((await prisma.user.findUnique({ where: { id: u.id } }))!.emailVerifiedAt).not.toBeNull();
  });
});

describe("admin sends a password reset", () => {
  const call = (id: number, sid?: string) =>
    adminReset(req(`/api/admin/users/${id}/send-password-reset`, {}, sid), { params: Promise.resolve({ id: String(id) }) });

  it("issues a reset token for the target user", async () => {
    const admin = await mkUser("ADMIN");
    const target = await mkUser("STUDENT");
    const res = await call(target.id, await createSession(admin.id));
    expect(res.status).toBe(200);
    expect(await prisma.passwordResetToken.count({ where: { userId: target.id } })).toBe(1);
  });

  it("refuses non-admins and unknown users", async () => {
    const student = await mkUser("STUDENT");
    const teacher = await mkUser("TEACHER");
    expect((await call(student.id, await createSession(teacher.id))).status).toBe(403);
    expect((await call(student.id)).status).toBe(403);
    expect(await prisma.passwordResetToken.count({ where: { userId: student.id } })).toBe(0);

    const admin = await mkUser("ADMIN");
    expect((await call(9_999_999, await createSession(admin.id))).status).toBe(404);
  });
});
