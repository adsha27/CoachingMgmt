import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/sessions/route";
import { DELETE } from "@/app/api/sessions/[id]/route";
import { prisma } from "@/lib/prisma";

// All test users share this prefix so afterEach can sweep them safely
const P = "__test__";

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
  await prisma.sessionStudent.deleteMany({
    where: { session: { teacher: { name: { startsWith: P } } } },
  });
  await prisma.session.deleteMany({
    where: { teacher: { name: { startsWith: P } } },
  });
  await prisma.teacherToken.deleteMany({
    where: { teacher: { name: { startsWith: P } } },
  });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

function post(body: unknown) {
  return new NextRequest("http://localhost/api/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ---------------------------------------------------------------------------
// Input validation — no Calendar or email needed
// ---------------------------------------------------------------------------

describe("POST /api/sessions — validation", () => {
  it("returns 400 when teacherId is missing", async () => {
    const res = await POST(
      post({ subject: "Math", scheduledDate: new Date().toISOString(), durationMinutes: 60 })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when subject is missing", async () => {
    const res = await POST(
      post({ teacherId: 1, scheduledDate: new Date().toISOString(), durationMinutes: 60 })
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when durationMinutes is missing", async () => {
    const res = await POST(
      post({ teacherId: 1, subject: "Math", scheduledDate: new Date().toISOString() })
    );
    expect(res.status).toBe(400);
  });

  it("returns 404 for non-existent teacher", async () => {
    const res = await POST(
      post({
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
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it("includes seeded sessions in the response", async () => {
    const teacher = await makeTeacher();
    await makeSession(teacher.id);

    const res = await GET();
    const data = await res.json();
    const found = data.find(
      (s: { subject: string }) => s.subject === `${P} Physics`
    );
    expect(found).toBeDefined();
    expect(found.teacher.name).toBe(`${P} Teacher`);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/sessions/:id
// ---------------------------------------------------------------------------

describe("DELETE /api/sessions/:id", () => {
  function del(id: number, body?: unknown) {
    return new NextRequest(`http://localhost/api/sessions/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body ?? {}),
    });
  }

  it("returns 404 for non-existent session", async () => {
    const res = await DELETE(del(999_999), { params: Promise.resolve({ id: "999999" }) });
    expect(res.status).toBe(404);
  });

  it("cancels a scheduled session and records the reason", async () => {
    const teacher = await makeTeacher();
    const session = await makeSession(teacher.id);
    // calendarEventId is set to a test value; Google API call will fail gracefully
    // (best-effort) since there is no real event. Status still updates.

    const res = await DELETE(del(session.id, { reason: "Holiday" }), {
      params: Promise.resolve({ id: String(session.id) }),
    });
    // Best-effort Calendar cancel may fail with test creds — that's acceptable;
    // the session status must still update.
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.session.status).toBe("CANCELLED");
    expect(data.session.cancelReason).toBe("Holiday");
  });

  it("returns 409 when cancelling an already-cancelled session", async () => {
    const teacher = await makeTeacher();
    const session = await makeSession(teacher.id);
    await prisma.session.update({
      where: { id: session.id },
      data: { status: "CANCELLED" },
    });

    const res = await DELETE(del(session.id), {
      params: Promise.resolve({ id: String(session.id) }),
    });
    expect(res.status).toBe(409);
  });
});
