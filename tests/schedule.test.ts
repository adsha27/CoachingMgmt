import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";

// Validates the token-gated schedule lookup logic that backs /schedule/[token].
// Tests the DB queries directly — the page just calls notFound() on the same checks.

const P = "__test__";

async function makeTeacher() {
  return prisma.user.create({
    data: {
      name: `${P} Teacher`,
      phone: `77${Date.now()}`.slice(0, 10),
      email: `schedule_${Date.now()}@test.invalid`,
      role: "TEACHER",
      teacherToken: { create: {} },
    },
    include: { teacherToken: true },
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

describe("teacher token lookup", () => {
  it("resolves an active token", async () => {
    const teacher = await makeTeacher();
    const token = teacher.teacherToken!.token;

    const found = await prisma.teacherToken.findUnique({ where: { token } });
    expect(found).not.toBeNull();
    expect(found!.deletedAt).toBeNull();
  });

  it("treats soft-deleted token as revoked (scheduleDate returns null)", async () => {
    const teacher = await makeTeacher();
    const token = teacher.teacherToken!.token;

    await prisma.teacherToken.update({
      where: { token },
      data: { deletedAt: new Date() },
    });

    const found = await prisma.teacherToken.findUnique({ where: { token } });
    expect(found!.deletedAt).not.toBeNull();
    // page logic: if (teacherToken.deletedAt) notFound()
  });

  it("returns null for a completely unknown token", async () => {
    const found = await prisma.teacherToken.findUnique({
      where: { token: "does-not-exist" },
    });
    expect(found).toBeNull();
  });
});

describe("schedule session filtering", () => {
  it("only returns future non-cancelled sessions for the teacher", async () => {
    const teacher = await makeTeacher();

    // Past session — should be excluded
    await prisma.session.create({
      data: {
        teacherId: teacher.id,
        subject: `${P} Past`,
        scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
        durationMinutes: 60,
      },
    });

    // Future cancelled session — should be excluded
    await prisma.session.create({
      data: {
        teacherId: teacher.id,
        subject: `${P} Cancelled`,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: "CANCELLED",
      },
    });

    // Future scheduled session — should appear
    await prisma.session.create({
      data: {
        teacherId: teacher.id,
        subject: `${P} Upcoming`,
        scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        durationMinutes: 60,
      },
    });

    const sessions = await prisma.session.findMany({
      where: {
        teacherId: teacher.id,
        status: { not: "CANCELLED" },
        scheduledDate: { gte: new Date() },
      },
    });

    expect(sessions).toHaveLength(1);
    expect(sessions[0].subject).toBe(`${P} Upcoming`);
  });

  it("returns sessions ordered by scheduledDate ascending", async () => {
    const teacher = await makeTeacher();
    const base = Date.now();

    await prisma.session.create({
      data: {
        teacherId: teacher.id,
        subject: `${P} Day 3`,
        scheduledDate: new Date(base + 3 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
      },
    });
    await prisma.session.create({
      data: {
        teacherId: teacher.id,
        subject: `${P} Day 1`,
        scheduledDate: new Date(base + 1 * 24 * 60 * 60 * 1000),
        durationMinutes: 60,
      },
    });

    const sessions = await prisma.session.findMany({
      where: { teacherId: teacher.id, status: { not: "CANCELLED" }, scheduledDate: { gte: new Date() } },
      orderBy: { scheduledDate: "asc" },
    });

    expect(sessions[0].subject).toBe(`${P} Day 1`);
    expect(sessions[1].subject).toBe(`${P} Day 3`);
  });
});
