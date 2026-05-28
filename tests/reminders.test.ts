import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/session-reminders/route";
import { prisma } from "@/lib/prisma";

const P = "__test_reminder__";
let seq = 0;

function uid() {
  return `${P}_${Date.now()}_${++seq}_${Math.random().toString(36).slice(2)}`;
}

function phone() {
  return `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;
}

function cronReq(secret?: string) {
  return new NextRequest("http://localhost/api/cron/session-reminders", {
    method: "GET",
    headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
  });
}

async function makeTeacher() {
  const id = uid();
  return prisma.user.create({
    data: { name: `${P} Teacher`, phone: phone(), email: `${id}@example.test`, role: "TEACHER" },
  });
}

async function makeStudent() {
  const id = uid();
  return prisma.user.create({
    data: { name: `${P} Student`, phone: phone(), email: `${id}@example.test`, role: "STUDENT" },
  });
}

// Build a complete 1-on-1 session: teacher -> package -> booking -> session
async function make1on1Session(opts: {
  scheduledAt?: Date;
  reminderSentAt?: Date | null;
  status?: "SCHEDULED" | "CANCELLED";
}) {
  const teacher = await makeTeacher();
  const student = await makeStudent();

  const pkg = await prisma.oneOnOnePackage.create({
    data: {
      teacherId: teacher.id,
      title: `${P} Physics Tutoring`,
      subject: "Physics",
      totalSessions: 5,
      sessionDurationMinutes: 60,
      priceINR: 500,
      status: "LISTED",
    },
  });

  const booking = await prisma.booking.create({
    data: {
      studentId: student.id,
      courseType: "ONE_ON_ONE",
      oneOnOnePackageId: pkg.id,
      totalSessions: 5,
      sessionsRemaining: 4,
    },
  });

  return prisma.session.create({
    data: {
      bookingId: booking.id,
      sessionNumber: 1,
      scheduledAt: opts.scheduledAt ?? new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      meetLink: "https://meet.google.com/test-reminder",
      reminderSentAt: opts.reminderSentAt ?? null,
      status: opts.status ?? "SCHEDULED",
    },
  });
}

beforeEach(() => {
  process.env.CRON_SECRET = "test-cron-secret";
  process.env.EMAIL_DELIVERY_MODE = "console";
});

afterEach(async () => {
  await prisma.session.deleteMany({
    where: {
      OR: [
        { booking: { oneOnOnePackage: { teacher: { name: { startsWith: P } } } } },
        { groupCourse: { teacher: { name: { startsWith: P } } } },
      ],
    },
  });
  await prisma.booking.deleteMany({ where: { student: { name: { startsWith: P } } } });
  await prisma.oneOnOnePackage.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("GET /api/cron/session-reminders", () => {
  it("returns 401 without a valid cron token", async () => {
    const res = await GET(cronReq());
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong token", async () => {
    const res = await GET(cronReq("wrong-secret"));
    expect(res.status).toBe(401);
  });

  it("sends a reminder for a 1-on-1 session in the 23-25 hour window", async () => {
    const session = await make1on1Session({ reminderSentAt: null });

    const res = await GET(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 1, errors: [] });

    const updated = await prisma.session.findUnique({ where: { id: session.id } });
    expect(updated!.reminderSentAt).not.toBeNull();
  });

  it("skips already-reminded sessions", async () => {
    await make1on1Session({ reminderSentAt: new Date() });

    const res = await GET(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 0, errors: [] });
  });

  it("skips cancelled sessions", async () => {
    await make1on1Session({ status: "CANCELLED" });

    const res = await GET(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 0, errors: [] });
  });

  it("skips sessions outside the 23-25h window (too soon)", async () => {
    await make1on1Session({ scheduledAt: new Date(Date.now() + 1 * 60 * 60 * 1000) });

    const res = await GET(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 0, errors: [] });
  });

  it("skips sessions outside the 23-25h window (too far)", async () => {
    await make1on1Session({ scheduledAt: new Date(Date.now() + 48 * 60 * 60 * 1000) });

    const res = await GET(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 0, errors: [] });
  });
});
