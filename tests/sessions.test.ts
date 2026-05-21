import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/sessions/route";
import { DELETE } from "@/app/api/sessions/[id]/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

// All test users share this prefix so afterEach can sweep them safely
const P = "__test__";

async function makeAdmin() {
  const user = await prisma.user.upsert({
    where: { email: `${P}_admin@test.invalid` },
    update: {},
    create: {
      name: `${P} Admin`,
      phone: `00${Date.now()}`.slice(0, 10),
      email: `${P}_admin@test.invalid`,
      role: "ADMIN",
    },
  });
  const sessionId = await createSession(user.id);
  return sessionId;
}

async function makeTeacher() {
  return prisma.user.create({
    data: {
      name: `${P} Teacher`,
      phone: `99${Date.now()}`.slice(0, 10),
      email: `teacher_${Date.now()}@test.invalid`,
      role: "TEACHER",
    },
  });
}

async function makeStudent() {
  return prisma.user.create({
    data: {
      name: `${P} Student`,
      phone: `88${Date.now() + 1}`.slice(0, 10),
      email: `student_${Date.now()}@test.invalid`,
      role: "STUDENT",
    },
  });
}

async function makeSession(teacherId: number, studentIds: number[] = []) {
  return prisma.session.create({
    data: {
      teacherId,
      subject: `${P} Physics`,
      scheduledDate: new Date(Date.now() + 60 * 60 * 1000),
      durationMinutes: 60,
      meetLink: "https://meet.google.com/test-link",
      calendarEventId: "test-event-id",
      students: { create: studentIds.map((id) => ({ studentId: id })) },
    },
  });
}

afterEach(async () => {
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.sessionStudent.deleteMany({
    where: { session: { teacher: { name: { startsWith: P } } } },
  });
  await prisma.session.deleteMany({
    where: { teacher: { name: { startsWith: P } } },
  });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

function adminReq(method: string, url: string, sid: string, body?: unknown) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Cookie: `${SESSION_COOKIE}=${sid}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

// ---------------------------------------------------------------------------
// Input validation — no Calendar or email needed
// ---------------------------------------------------------------------------

describe("POST /api/sessions — validation", () => {
  it("returns 400 when teacherId is missing", async () => {
    const sid = await makeAdmin();
    const res = await POST(
      adminReq("POST", "/api/sessions", sid, { subject: "Math", scheduledDate: new Date().toISOString(), durationMinutes: 60 })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when subject is missing", async () => {
    const sid = await makeAdmin();
    const res = await POST(
      adminReq("POST", "/api/sessions", sid, { teacherId: 1, scheduledDate: new Date().toISOString(), durationMinutes: 60 })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when durationMinutes is missing", async () => {
    const sid = await makeAdmin();
    const res = await POST(
      adminReq("POST", "/api/sessions", sid, { teacherId: 1, subject: "Math", scheduledDate: new Date().toISOString() })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent teacher", async () => {
    const sid = await makeAdmin();
    const res = await POST(
      adminReq("POST", "/api/sessions", sid, {
        teacherId: 999_999,
        subject: "Math",
        scheduledDate: new Date().toISOString(),
        durationMinutes: 60,
      })
    );
    expect(res.status).toBe(404);
  });

  // Calendar API is called after teacher lookup, so a real teacher is needed
  // to reach the Calendar path. That path is verified by scripts/test-calendar.ts.
});

// ---------------------------------------------------------------------------
// GET /api/sessions
// ---------------------------------------------------------------------------

describe("GET /api/sessions", () => {
  it("returns an array", async () => {
    const sid = await makeAdmin();
    const res = await GET(adminReq("GET", "/api/sessions", sid));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("includes seeded sessions in the response", async () => {
    const sid = await makeAdmin();
    const teacher = await makeTeacher();
    await makeSession(teacher.id);

    const res = await GET(adminReq("GET", "/api/sessions", sid));
    const data = await res.json();
    const found = data.find(
      (s: { subject: string }) => s.subject === `${P} Physics`
    );
    expect(found).toBeDefined();
    expect(found.teacher.name).toBe(`${P} Teacher`);
  });
});
