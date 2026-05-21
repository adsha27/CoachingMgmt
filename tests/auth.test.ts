import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as requestOtp } from "@/app/api/auth/otp/request/route";
import { POST as verifyOtp } from "@/app/api/auth/otp/verify/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";
import { hashCode } from "@/lib/otp";

const P = "__test_auth__";

let seq = 0;
function unique(prefix: string) {
  seq += 1;
  return `${prefix}_${Date.now()}_${seq}_${Math.random().toString(36).slice(2)}`;
}

function phone() {
  return `${Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)}`;
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

async function makeUser(role: "ADMIN" | "TEACHER" | "STUDENT" = "TEACHER") {
  const id = unique(role.toLowerCase());
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
  await prisma.otpCode.deleteMany({ where: { email: { contains: "example.test" } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("POST /api/auth/otp/request", () => {
  it("stores an OTP hash for a registered active email", async () => {
    const user = await makeUser();
    const res = await requestOtp(jsonReq("POST", "/api/auth/otp/request", { email: user.email }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    const code = await prisma.otpCode.findFirst({ where: { email: user.email } });
    expect(code).not.toBeNull();
    expect(code!.codeHash).not.toHaveLength(0);
    expect(code!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("does not enumerate unknown emails", async () => {
    const email = `${unique("missing")}@example.test`;
    const res = await requestOtp(jsonReq("POST", "/api/auth/otp/request", { email }));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(await prisma.otpCode.count({ where: { email } })).toBe(0);
  });

  it("rate limits more than 5 requests per 15 minutes", async () => {
    const user = await makeUser();
    await prisma.otpCode.createMany({
      data: Array.from({ length: 5 }, () => ({
        email: user.email,
        codeHash: "hash",
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      })),
    });

    const res = await requestOtp(jsonReq("POST", "/api/auth/otp/request", { email: user.email }));
    expect(res.status).toBe(429);
  });

  it("uses fixed 123456 OTP for the seeded local admin in non-production", async () => {
    // The admin@example.test account may already exist from the demo seed — upsert handles both cases
    await prisma.user.upsert({
      where: { email: "admin@example.test" },
      update: {},
      create: {
        name: "Admin",
        phone: phone(),
        email: "admin@example.test",
        role: "ADMIN",
      },
    });

    const requestRes = await requestOtp(jsonReq("POST", "/api/auth/otp/request", { email: "admin@example.test" }));
    expect(requestRes.status).toBe(200);

    const verifyRes = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", {
      email: "admin@example.test",
      code: "123456",
    }));
    expect(verifyRes.status).toBe(200);
    expect(await verifyRes.json()).toMatchObject({ ok: true, redirect: "/admin" });
  });
});

describe("POST /api/auth/otp/verify", () => {
  it("verifies a valid code, marks it used, creates a session cookie, and redirects by role", async () => {
    const user = await makeUser("STUDENT");
    const otp = await prisma.otpCode.create({
      data: {
        email: user.email,
        codeHash: await hashCode("123456"),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const res = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { email: user.email, code: "123456" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, redirect: "/student/dashboard" });
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);

    const updated = await prisma.otpCode.findUnique({ where: { id: otp.id } });
    expect(updated!.usedAt).not.toBeNull();
    expect(await prisma.userSession.count({ where: { userId: user.id } })).toBe(1);
  });

  it("rejects expired codes", async () => {
    const user = await makeUser();
    await prisma.otpCode.create({
      data: {
        email: user.email,
        codeHash: await hashCode("123456"),
        expiresAt: new Date(Date.now() - 1000),
      },
    });

    const res = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { email: user.email, code: "123456" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Code expired" });
  });

  it("rejects already-used codes", async () => {
    const user = await makeUser();
    await prisma.otpCode.create({
      data: {
        email: user.email,
        codeHash: await hashCode("123456"),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        usedAt: new Date(),
      },
    });

    const res = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { email: user.email, code: "123456" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Code already used" });
  });

  it("rejects wrong codes and increments failed attempts", async () => {
    const user = await makeUser();
    const otp = await prisma.otpCode.create({
      data: {
        email: user.email,
        codeHash: await hashCode("123456"),
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const res = await verifyOtp(jsonReq("POST", "/api/auth/otp/verify", { email: user.email, code: "999999" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toMatchObject({ error: "Invalid code" });

    const updated = await prisma.otpCode.findUnique({ where: { id: otp.id } });
    expect(updated!.failedAttempts).toBe(1);
  });
});

describe("POST /api/auth/logout", () => {
  it("deletes the session and clears the sid cookie", async () => {
    const user = await makeUser("ADMIN");
    const sid = await createSession(user.id);

    const res = await logout(jsonReq("POST", "/api/auth/logout", undefined, sid));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/login");
    expect(res.headers.get("set-cookie")).toContain(`${SESSION_COOKIE}=`);
    expect(await prisma.userSession.count({ where: { sessionId: sid } })).toBe(0);
  });
});
