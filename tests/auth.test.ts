import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as requestOtp } from "@/app/api/auth/otp/request/route";
import { POST as verifyOtp } from "@/app/api/auth/otp/verify/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { hashCode } from "@/lib/otp";
import { createRegToken } from "@/lib/regtoken";

const P = "__test_auth__";
let seq = 0;

function uid() {
  return `${P}_${Date.now()}_${++seq}_${Math.random().toString(36).slice(2)}`;
}

// Generate unique 10-digit Indian mobile starting with 9
function phone() {
  return `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;
}

function jsonReq(method: string, url: string, body?: unknown, sid?: string) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sid ? { Cookie: `${SESSION_COOKIE}=${sid}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

async function makeUser(role: "ADMIN" | "TEACHER" | "STUDENT" = "STUDENT") {
  const id = uid();
  return prisma.user.create({
    data: {
      name: `${P} ${role}`,
      phone: phone(),
      email: `${id}@example.test`,
      role,
    },
  });
}

afterEach(async () => {
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.otpCode.deleteMany({ where: { phone: { startsWith: "9" } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

// ─── OTP Request ──────────────────────────────────────────────────────────────

describe("POST /api/auth/otp/request", () => {
  it("stores an OTP hash for any submitted phone (including unregistered)", async () => {
    const p = phone();
    const res = await requestOtp(jsonReq("POST", "/api/auth/otp/request", { phone: p }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    const code = await prisma.otpCode.findFirst({ where: { phone: p } });
    expect(code).not.toBeNull();
    expect(code!.codeHash).not.toHaveLength(0);
    expect(code!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects malformed phone numbers", async () => {
    const res = await requestOtp(jsonReq("POST", "/api/auth/otp/request", { phone: "12345" }));
    expect(res.status).toBe(400);
  });

  it("rejects phone starting with 0-5 (not a mobile number)", async () => {
    const res = await requestOtp(jsonReq("POST", "/api/auth/otp/request", { phone: "1234567890" }));
    expect(res.status).toBe(400);
  });

  it("rate limits after 3 requests per hour", async () => {
    const p = phone();
    await prisma.otpCode.createMany({
      data: Array.from({ length: 3 }, () => ({
        phone: p,
        codeHash: "hash",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })),
    });
    const res = await requestOtp(jsonReq("POST", "/api/auth/otp/request", { phone: p }));
    expect(res.status).toBe(429);
  });

  it("accepts +91 prefix and normalises to 10 digits", async () => {
    const base = phone();
    const res = await requestOtp(jsonReq("POST", "/api/auth/otp/request", { phone: `+91${base}` }));
    expect(res.status).toBe(200);
    const code = await prisma.otpCode.findFirst({ where: { phone: base } });
    expect(code).not.toBeNull();
  });

  it("works for the dev fixed phone in non-production", async () => {
    const devPhone = process.env.DEV_FIXED_OTP_PHONE ?? "9999999999";
    await requestOtp(jsonReq("POST", "/api/auth/otp/request", { phone: devPhone }));
    const verifyRes = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", {
      phone: devPhone,
      code: process.env.DEV_FIXED_OTP_CODE ?? "123456",
    }));
    // Unregistered phone → needs_registration (that's correct)
    const data = await verifyRes.json();
    expect(verifyRes.status).toBe(200);
    expect(data.ok).toBe(true);
  });
});

// ─── OTP Verify ───────────────────────────────────────────────────────────────

describe("POST /api/auth/otp/verify", () => {
  it("creates a session and redirects for an existing user", async () => {
    const user = await makeUser("STUDENT");
    const otp = await prisma.otpCode.create({
      data: { phone: user.phone, codeHash: await hashCode("123456"), expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    const res = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { phone: user.phone, code: "123456" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, redirect: "/student/dashboard" });
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);

    const updated = await prisma.otpCode.findUnique({ where: { id: otp.id } });
    expect(updated!.usedAt).not.toBeNull();
    expect(await prisma.userSession.count({ where: { userId: user.id } })).toBe(1);
  });

  it("returns needs_registration for an unknown phone", async () => {
    const p = phone();
    await prisma.otpCode.create({
      data: { phone: p, codeHash: await hashCode("123456"), expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    const res = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { phone: p, code: "123456" }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({ ok: true, needs_registration: true });
    expect(data.registration_token).toBeTruthy();
    expect(res.headers.get("set-cookie")).toBeNull(); // no session yet
  });

  it("rejects expired codes", async () => {
    const user = await makeUser();
    await prisma.otpCode.create({
      data: { phone: user.phone, codeHash: await hashCode("123456"), expiresAt: new Date(Date.now() - 1000) },
    });
    const res = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { phone: user.phone, code: "123456" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Code expired" });
  });

  it("rejects already-used codes", async () => {
    const user = await makeUser();
    await prisma.otpCode.create({
      data: { phone: user.phone, codeHash: await hashCode("123456"), expiresAt: new Date(Date.now() + 10 * 60 * 1000), usedAt: new Date() },
    });
    const res = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { phone: user.phone, code: "123456" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Code already used" });
  });

  it("rejects wrong codes and increments failedAttempts", async () => {
    const user = await makeUser();
    const otp = await prisma.otpCode.create({
      data: { phone: user.phone, codeHash: await hashCode("123456"), expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });
    const res = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { phone: user.phone, code: "999999" }));
    expect(res.status).toBe(400);
    const updated = await prisma.otpCode.findUnique({ where: { id: otp.id } });
    expect(updated!.failedAttempts).toBe(1);
  });

  it("locks out after 5 failed attempts", async () => {
    const user = await makeUser();
    const otp = await prisma.otpCode.create({
      data: { phone: user.phone, codeHash: await hashCode("123456"), expiresAt: new Date(Date.now() + 10 * 60 * 1000), failedAttempts: 4 },
    });
    await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { phone: user.phone, code: "999999" }));
    const updated = await prisma.otpCode.findUnique({ where: { id: otp.id } });
    expect(updated!.usedAt).not.toBeNull(); // invalidated
  });
});

// ─── Register ─────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  it("creates user and issues session from a valid registration token", async () => {
    const p = phone();
    const token = createRegToken(p);
    const id = uid();

    const res = await register(jsonReq("POST", "/api/auth/register", {
      registration_token: token,
      name: `${P} New`,
      email: `${id}@example.test`,
      role: "STUDENT",
    }));

    expect(res.status).toBe(201);
    expect(await res.json()).toMatchObject({ ok: true, redirect: "/student/dashboard" });
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);

    const user = await prisma.user.findUnique({ where: { phone: p } });
    expect(user).not.toBeNull();
    expect(user!.role).toBe("STUDENT");
  });

  it("rejects an expired or invalid registration token", async () => {
    const id = uid();
    const res = await register(jsonReq("POST", "/api/auth/register", {
      registration_token: "invalid.token",
      name: `${P} Bad`,
      email: `${id}@example.test`,
      role: "STUDENT",
    }));
    expect(res.status).toBe(401);
  });

  it("rejects ADMIN role on self-registration", async () => {
    const p = phone();
    const token = createRegToken(p);
    const id = uid();
    const res = await register(jsonReq("POST", "/api/auth/register", {
      registration_token: token,
      name: `${P} Hacker`,
      email: `${id}@example.test`,
      role: "ADMIN",
    }));
    expect(res.status).toBe(400);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────

describe("POST /api/auth/logout", () => {
  it("deletes the session and clears the cookie", async () => {
    const user = await makeUser("ADMIN");
    const sid = await createSession(user.id);
    const res = await logout(jsonReq("POST", "/api/auth/logout", undefined, sid));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/login");
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);
    expect(await prisma.userSession.count({ where: { sessionId: sid } })).toBe(0);
  });
});
