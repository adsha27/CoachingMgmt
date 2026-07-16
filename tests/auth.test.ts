import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import bcryptjs from "bcryptjs";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { POST as logout } from "@/app/api/auth/logout/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const P = "__test_auth__";
let seq = 0;

function uid() {
  return `${P}_${Date.now()}_${++seq}_${Math.random().toString(36).slice(2)}`;
}

// Unique 10-digit Indian mobile starting with 9
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

async function makeUser(
  role: "ADMIN" | "TEACHER" | "STUDENT" = "STUDENT",
  opts: { password?: string; status?: "ACTIVE" | "SUSPENDED" } = {},
) {
  const id = uid();
  return prisma.user.create({
    data: {
      name: `${P} ${role}`,
      phone: phone(),
      email: `${id}@example.test`,
      role,
      status: opts.status ?? "ACTIVE",
      password: opts.password ? await bcryptjs.hash(opts.password, 10) : null,
    },
  });
}

async function makeListedCourse(teacherId: number) {
  return prisma.groupCourse.create({
    data: {
      teacherId,
      title: `${P} course`,
      subject: "Physics",
      totalSessions: 10,
      sessionDurationMinutes: 60,
      priceINR: 5000,
      maxStudents: 30,
      startDate: new Date(),
      status: "LISTED",
    },
  });
}

afterEach(async () => {
  await prisma.booking.deleteMany({ where: { student: { name: { startsWith: P } } } });
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.groupCourse.deleteMany({ where: { title: { startsWith: P } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

// ─── Register ─────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("creates a user with a hashed password and a session", async () => {
    const p = phone();
    const email = `${uid()}@example.test`;
    const res = await register(jsonReq("POST", "/api/auth/register", {
      name: "Arjun", email, phone: p, password: "supersecret", role: "STUDENT",
    }));
    expect(res.status).toBe(201);
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBeTruthy();

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user?.password).toBeTruthy();
    expect(user?.password).not.toBe("supersecret"); // stored as a hash
    expect(await bcryptjs.compare("supersecret", user!.password!)).toBe(true);
  });

  it("rejects passwords under 8 characters", async () => {
    const res = await register(jsonReq("POST", "/api/auth/register", {
      name: "A", email: `${uid()}@example.test`, phone: phone(), password: "short", role: "STUDENT",
    }));
    expect(res.status).toBe(400);
  });

  it("never lets a caller self-assign ADMIN", async () => {
    const res = await register(jsonReq("POST", "/api/auth/register", {
      name: "A", email: `${uid()}@example.test`, phone: phone(), password: "supersecret", role: "ADMIN",
    }));
    expect(res.status).toBe(400);
  });

  it("rejects a duplicate email or phone", async () => {
    const existing = await makeUser("STUDENT");
    const res = await register(jsonReq("POST", "/api/auth/register", {
      name: "Dup", email: existing.email, phone: phone(), password: "supersecret", role: "STUDENT",
    }));
    expect(res.status).toBe(409);
  });

  it("creates a PENDING application when applyCourseId is passed", async () => {
    const teacher = await makeUser("TEACHER");
    const course = await makeListedCourse(teacher.id);
    const email = `${uid()}@example.test`;
    const res = await register(jsonReq("POST", "/api/auth/register", {
      name: "Applicant", email, phone: phone(), password: "supersecret", role: "STUDENT",
      applyCourseId: course.id, targetExam: "NEET", currentClass: "Class 12",
    }));
    expect(res.status).toBe(201);

    const student = await prisma.user.findUnique({ where: { email } });
    const booking = await prisma.booking.findFirst({ where: { studentId: student!.id, groupCourseId: course.id } });
    expect(booking?.status).toBe("PENDING");
    // The seat is NOT taken until a teacher approves.
    const fresh = await prisma.groupCourse.findUnique({ where: { id: course.id } });
    expect(fresh?.enrolledCount).toBe(0);
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
  it("signs in with the correct email and password", async () => {
    const user = await makeUser("STUDENT", { password: "supersecret" });
    const res = await login(jsonReq("POST", "/api/auth/login", { email: user.email, password: "supersecret" }));
    expect(res.status).toBe(200);
    expect(res.cookies.get(SESSION_COOKIE)?.value).toBeTruthy();
    const data = await res.json();
    expect(data.redirect).toBe("/student/dashboard");
  });

  it("returns a generic 401 for a wrong password", async () => {
    const user = await makeUser("STUDENT", { password: "supersecret" });
    const res = await login(jsonReq("POST", "/api/auth/login", { email: user.email, password: "wrong" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Invalid email or password");
  });

  it("returns the same generic 401 for an unknown email (no enumeration)", async () => {
    const res = await login(jsonReq("POST", "/api/auth/login", { email: `${uid()}@nope.test`, password: "whatever" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Invalid email or password");
  });

  it("locks the account after 5 failed attempts", async () => {
    const user = await makeUser("STUDENT", { password: "supersecret" });
    for (let i = 0; i < 5; i++) {
      await login(jsonReq("POST", "/api/auth/login", { email: user.email, password: "wrong" }));
    }
    // Even the correct password is now refused with a lockout status.
    const res = await login(jsonReq("POST", "/api/auth/login", { email: user.email, password: "supersecret" }));
    expect(res.status).toBe(423);
  });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
describe("POST /api/auth/logout", () => {
  it("deletes the session", async () => {
    const user = await makeUser("STUDENT", { password: "supersecret" });
    const sid = await createSession(user.id);
    const res = await logout(jsonReq("POST", "/api/auth/logout", undefined, sid));
    expect(res.status).toBe(200);
    const session = await prisma.userSession.findUnique({ where: { sessionId: sid } });
    expect(session).toBeNull();
  });
});
