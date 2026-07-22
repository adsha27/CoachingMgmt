import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import bcryptjs from "bcryptjs";
import { POST as forgot } from "@/app/api/auth/forgot-password/route";
import { POST as reset } from "@/app/api/auth/reset-password/route";
import { POST as login } from "@/app/api/auth/login/route";
import { createResetToken, consumeResetToken, hashToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

const P = "__test_pwreset__";
let seq = 0;
const uid = () => `${P}_${Date.now()}_${++seq}`;
const phone = () => `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;

async function makeUser(password: string | null = "OldPassw0rd", extra: Record<string, unknown> = {}) {
  const id = uid();
  return prisma.user.create({
    data: {
      name: `${P} User`, phone: phone(), email: `${id}@test.invalid`, role: "STUDENT", status: "ACTIVE",
      password: password ? await bcryptjs.hash(password, 10) : null,
      ...extra,
    },
  });
}
const jreq = (url: string, body: unknown) =>
  new NextRequest(`http://localhost${url}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

afterEach(async () => {
  await prisma.passwordResetToken.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("password reset — token lib", () => {
  it("stores only the hash, and consume returns the userId once", async () => {
    const u = await makeUser();
    const raw = await createResetToken(u.id);

    const row = await prisma.passwordResetToken.findFirst({ where: { userId: u.id } });
    expect(row!.tokenHash).toBe(hashToken(raw));
    expect(row!.tokenHash).not.toBe(raw); // raw is never stored

    expect(await consumeResetToken(raw)).toBe(u.id);
    expect(await consumeResetToken(raw)).toBeNull(); // single-use — can't replay
  });

  it("issuing a new token invalidates the previous unused one", async () => {
    const u = await makeUser();
    const first = await createResetToken(u.id);
    const second = await createResetToken(u.id);

    expect(await consumeResetToken(first)).toBeNull(); // superseded
    expect(await consumeResetToken(second)).toBe(u.id);
  });

  it("rejects expired and garbage tokens", async () => {
    const u = await makeUser();
    const raw = await createResetToken(u.id);
    await prisma.passwordResetToken.updateMany({
      where: { userId: u.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    expect(await consumeResetToken(raw)).toBeNull();
    expect(await consumeResetToken("not-a-real-token")).toBeNull();
    expect(await consumeResetToken("")).toBeNull();
  });
});

describe("POST /api/auth/forgot-password", () => {
  it("returns generic 200 and creates a token for a real account", async () => {
    const u = await makeUser();
    const res = await forgot(jreq("/api/auth/forgot-password", { email: u.email }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(await prisma.passwordResetToken.count({ where: { userId: u.id } })).toBe(1);
  });

  it("returns the same generic 200 for an unknown email — no token, no leak", async () => {
    const res = await forgot(jreq("/api/auth/forgot-password", { email: `${uid()}@nope.invalid` }));
    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(await prisma.passwordResetToken.count({ where: { user: { name: { startsWith: P } } } })).toBe(0);
  });

  it("does not issue a token for an account with no password set", async () => {
    const u = await makeUser(null);
    const res = await forgot(jreq("/api/auth/forgot-password", { email: u.email }));
    expect(res.status).toBe(200);
    expect(await prisma.passwordResetToken.count({ where: { userId: u.id } })).toBe(0);
  });
});

describe("POST /api/auth/reset-password", () => {
  it("resets the password end-to-end: new password logs in, old one fails", async () => {
    const u = await makeUser("OldPassw0rd");
    const raw = await createResetToken(u.id);

    const res = await reset(jreq("/api/auth/reset-password", { token: raw, password: "BrandNew123" }));
    expect(res.status).toBe(200);

    // Old password rejected, new password accepted.
    expect((await login(jreq("/api/auth/login", { email: u.email, password: "OldPassw0rd" }))).status).toBe(401);
    expect((await login(jreq("/api/auth/login", { email: u.email, password: "BrandNew123" }))).status).toBe(200);
  });

  it("clears an existing lockout so the user can sign in immediately", async () => {
    const u = await makeUser("OldPassw0rd", { loginAttempts: 5, lockedUntil: new Date(Date.now() + 60 * 60 * 1000) });
    const raw = await createResetToken(u.id);
    expect((await reset(jreq("/api/auth/reset-password", { token: raw, password: "BrandNew123" }))).status).toBe(200);
    const after = await prisma.user.findUnique({ where: { id: u.id } });
    expect(after!.loginAttempts).toBe(0);
    expect(after!.lockedUntil).toBeNull();
  });

  it("rejects a reused token (400) and does not change the password again", async () => {
    const u = await makeUser("OldPassw0rd");
    const raw = await createResetToken(u.id);
    await reset(jreq("/api/auth/reset-password", { token: raw, password: "FirstReset1" }));
    const res = await reset(jreq("/api/auth/reset-password", { token: raw, password: "SecondReset2" }));
    expect(res.status).toBe(400);
    // still the first reset's password
    expect((await login(jreq("/api/auth/login", { email: u.email, password: "FirstReset1" }))).status).toBe(200);
  });

  it("rejects an expired token (400)", async () => {
    const u = await makeUser();
    const raw = await createResetToken(u.id);
    await prisma.passwordResetToken.updateMany({ where: { userId: u.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    expect((await reset(jreq("/api/auth/reset-password", { token: raw, password: "BrandNew123" }))).status).toBe(400);
  });

  it("rejects invalid token and too-short password (400), without consuming a valid token", async () => {
    const u = await makeUser();
    const raw = await createResetToken(u.id);

    expect((await reset(jreq("/api/auth/reset-password", { token: "garbage", password: "BrandNew123" }))).status).toBe(400);
    expect((await reset(jreq("/api/auth/reset-password", { token: raw, password: "short" }))).status).toBe(400);
    // the short-password attempt must NOT have consumed the token
    expect((await reset(jreq("/api/auth/reset-password", { token: raw, password: "ValidPass123" }))).status).toBe(200);
  });
});
