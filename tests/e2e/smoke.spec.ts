import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const P = "__e2e__";

async function clean() {
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.teacherAvailability.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.sessionStudent.deleteMany({ where: { session: { teacher: { name: { startsWith: P } } } } });
  await prisma.session.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
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

test.beforeEach(async () => {
  await clean();
});

test.afterAll(async () => {
  await clean();
  await prisma.$disconnect();
});

test("admin, teacher, student, and public schedule smoke flow", async ({ page, context }) => {
  const admin = await prisma.user.create({
    data: {
      name: `${P} Admin`,
      phone: `100${Date.now()}`.slice(0, 10),
      email: `admin_${Date.now()}@example.test`,
      role: "ADMIN",
    },
  });
  const teacher = await prisma.user.create({
    data: {
      name: `${P} Teacher`,
      phone: `200${Date.now()}`.slice(0, 10),
      email: `teacher_${Date.now()}@example.test`,
      role: "TEACHER",
      teacherToken: { create: {} },
    },
    include: { teacherToken: true },
  });
  const student = await prisma.user.create({
    data: {
      name: `${P} Student`,
      phone: `300${Date.now()}`.slice(0, 10),
      email: `student_${Date.now()}@example.test`,
      role: "STUDENT",
    },
  });

  await prisma.teacherAvailability.create({
    data: {
      teacherId: teacher.id,
      startTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
      note: "E2E reference slot",
    },
  });

  const session = await prisma.session.create({
    data: {
      teacherId: teacher.id,
      subject: `${P} Physics`,
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      meetLink: "https://meet.google.com/e2e-test",
      students: { create: [{ studentId: student.id }] },
    },
  });

  await context.addCookies([await sessionCookie(admin.id)]);
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Sessions" })).toBeVisible();
  await expect(page.getByText(`${P} Physics`)).toBeVisible();

  await page.goto("/admin/sessions/new");
  await page.getByLabel("Teacher").selectOption(String(teacher.id));
  await expect(page.getByText("Teacher availability")).toBeVisible();
  await expect(page.getByText("E2E reference slot")).toBeVisible();

  await context.clearCookies();
  await context.addCookies([await sessionCookie(teacher.id)]);
  await page.goto("/teacher/dashboard");
  await expect(page.getByRole("heading", { name: `${P} Teacher` })).toBeVisible();
  await expect(page.getByText(`${P} Physics`)).toBeVisible();
  await page.goto(`/teacher/sessions/${session.id}`);
  await expect(page.getByText(student.email)).toBeVisible();

  await context.clearCookies();
  await context.addCookies([await sessionCookie(student.id)]);
  await page.goto("/student/dashboard");
  await expect(page.getByRole("heading", { name: `${P} Student` })).toBeVisible();
  await expect(page.getByText(`${P} Physics`)).toBeVisible();
  await page.goto(`/student/sessions/${session.id}`);
  await expect(page.getByText(`${P} Teacher`)).toBeVisible();

  await context.clearCookies();
  await page.goto(`/schedule/${teacher.teacherToken!.token}`);
  await expect(page.getByRole("heading", { name: `${P} Teacher` })).toBeVisible();
  await expect(page.getByText("1 student")).toBeVisible();
});
