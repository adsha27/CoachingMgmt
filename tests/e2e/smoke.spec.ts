import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const P = "__e2e__";

function phone(prefix: string) {
  return `${prefix}${Date.now()}`.slice(0, 10);
}

async function clean() {
  await prisma.session.deleteMany({
    where: {
      OR: [
        { groupCourse: { teacher: { name: { startsWith: P } } } },
        { booking: { oneOnOnePackage: { teacher: { name: { startsWith: P } } } } },
      ],
    },
  });
  await prisma.booking.deleteMany({ where: { student: { name: { startsWith: P } } } });
  await prisma.oneOnOnePackage.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.teacherAvailability.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.teacherToken.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
}

async function sessionCookie(userId: number) {
  const row = await prisma.userSession.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });
  return {
    name: "sid",
    value: row.sessionId,
    domain: "127.0.0.1",
    path: "/",
    httpOnly: true,
    sameSite: "Lax" as const,
    expires: Math.floor(row.expiresAt.getTime() / 1000),
  };
}

test.beforeEach(async () => { await clean(); });
test.afterAll(async () => { await clean(); await prisma.$disconnect(); });

test("admin, teacher, student, and public schedule smoke flow", async ({ page, context }) => {
  const ts = Date.now();

  const admin = await prisma.user.create({
    data: { name: `${P} Admin`, phone: phone("100"), email: `admin_${ts}@example.test`, role: "ADMIN" },
  });
  const teacher = await prisma.user.create({
    data: {
      name: `${P} Teacher`,
      phone: phone("200"),
      email: `teacher_${ts}@example.test`,
      role: "TEACHER",
      teacherToken: { create: {} },
    },
    include: { teacherToken: true },
  });
  const student = await prisma.user.create({
    data: { name: `${P} Student`, phone: phone("300"), email: `student_${ts}@example.test`, role: "STUDENT" },
  });

  // Weekly availability slot
  await prisma.teacherAvailability.create({
    data: { teacherId: teacher.id, dayOfWeek: "MON", startTime: "09:00", endTime: "10:00" },
  });

  // 1-on-1 package → booking → session
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
  const session = await prisma.session.create({
    data: {
      bookingId: booking.id,
      sessionNumber: 1,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      meetLink: "https://meet.google.com/e2e-test",
    },
  });

  // Admin can see dashboard stats
  await context.addCookies([await sessionCookie(admin.id)]);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin Dashboard" })).toBeVisible();
  await expect(page.getByText("Active teachers")).toBeVisible();

  // Teacher can see their upcoming session on dashboard
  await context.clearCookies();
  await context.addCookies([await sessionCookie(teacher.id)]);
  await page.goto("/teacher/dashboard");
  await expect(page.getByRole("heading", { name: `${P} Teacher` })).toBeVisible();
  await expect(page.getByText(`${P} Physics Tutoring`)).toBeVisible();

  // Teacher can see session detail with student info
  await page.goto(`/teacher/sessions/${session.id}`);
  await expect(page.getByText(student.email!)).toBeVisible();

  // Student can see their upcoming session
  await context.clearCookies();
  await context.addCookies([await sessionCookie(student.id)]);
  await page.goto("/student/dashboard");
  await expect(page.getByRole("heading", { name: `${P} Student` })).toBeVisible();
  await expect(page.getByText(`${P} Physics Tutoring`)).toBeVisible();

  // Student session detail shows teacher name
  await page.goto(`/student/sessions/${session.id}`);
  await expect(page.getByText(`${P} Teacher`)).toBeVisible();

  // Public schedule page for teacher
  await context.clearCookies();
  await page.goto(`/schedule/${teacher.teacherToken!.token}`);
  await expect(page.getByRole("heading", { name: `${P} Teacher` })).toBeVisible();
  await expect(page.getByText(`${P} Physics Tutoring`)).toBeVisible();
});
