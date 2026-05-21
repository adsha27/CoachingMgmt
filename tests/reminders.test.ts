import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/cron/session-reminders/route";
import { prisma } from "@/lib/prisma";

const P = "__test_reminder__";

let seq = 0;
function unique(prefix: string) {
  seq += 1;
  return `${prefix}_${Date.now()}_${seq}_${Math.random().toString(36).slice(2)}`;
}

function phone() {
  return `${Math.floor(1_000_000_000 + Math.random() * 9_000_000_000)}`;
}

function cronReq(secret?: string) {
  return new NextRequest("http://localhost/api/cron/session-reminders", {
    method: "GET",
    headers: secret ? { Authorization: `Bearer ${secret}` } : undefined,
  });
}

async function makeTeacher() {
  const id = unique("teacher");
  return prisma.user.create({
    data: {
      name: `${P} Teacher`,
      phone: phone(),
      email: `${id}@example.test`,
      role: "TEACHER",
    },
  });
}

async function makeStudent() {
  const id = unique("student");
  return prisma.user.create({
    data: {
      name: `${P} Student`,
      phone: phone(),
      email: `${id}@example.test`,
      role: "STUDENT",
    },
  });
}

async function makeSession(data: { reminderSentAt?: Date | null; status?: "SCHEDULED" | "CANCELLED" }) {
  const teacher = await makeTeacher();
  const student = await makeStudent();
  return prisma.session.create({
    data: {
      teacherId: teacher.id,
      subject: `${P} Physics`,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      meetLink: "https://meet.google.com/test-reminder",
      reminderSentAt: data.reminderSentAt,
      status: data.status ?? "SCHEDULED",
      students: { create: [{ studentId: student.id }] },
    },
  });
}

afterEach(async () => {
  await prisma.sessionStudent.deleteMany({ where: { session: { teacher: { name: { startsWith: P } } } } });
  await prisma.session.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("GET /api/cron/session-reminders", () => {
  it("returns 401 without a valid cron token", async () => {
    const res = await GET(cronReq());
    expect(res.status).toBe(401);
  });

  it("sends a reminder for sessions in the 23-25 hour window", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    const session = await makeSession({ reminderSentAt: null });

    const res = await GET(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 1, errors: [] });

    const updated = await prisma.session.findUnique({ where: { id: session.id } });
    expect(updated!.reminderSentAt).not.toBeNull();
  });

  it("skips already-reminded sessions", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    await makeSession({ reminderSentAt: new Date() });

    const res = await GET(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 0, errors: [] });
  });

  it("skips cancelled sessions", async () => {
    process.env.CRON_SECRET = "test-cron-secret";
    await makeSession({ reminderSentAt: null, status: "CANCELLED" });

    const res = await GET(cronReq("test-cron-secret"));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ sent: 0, errors: [] });
  });
});
