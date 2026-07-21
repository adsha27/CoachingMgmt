import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/teacher/courses/group/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const P = "__test_courses__";
let seq = 0;

function uid() {
  return `${P}_${Date.now()}_${++seq}_${Math.random().toString(36).slice(2)}`;
}
function phone() {
  return `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;
}
async function makeTeacher() {
  const id = uid();
  return prisma.user.create({
    data: { name: `${P} Teacher`, phone: phone(), email: `${id}@example.test`, role: "TEACHER", status: "ACTIVE" },
  });
}
function req(sid: string, body: unknown) {
  return new NextRequest("http://localhost/api/teacher/courses/group", {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE}=${sid}` },
    body: JSON.stringify(body),
  });
}

afterEach(async () => {
  await prisma.session.deleteMany({ where: { groupCourse: { teacher: { name: { startsWith: P } } } } });
  await prisma.groupCourse.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("group course creation", () => {
  // Regression: 25 sessions used to blow past Prisma's 5s interactive-transaction
  // timeout (26 sequential inserts) and 500 → "Failed to create course."
  it("creates a course with many sessions in one batch", async () => {
    const teacher = await makeTeacher();
    const sid = await createSession(teacher.id);

    const res = await POST(req(sid, {
      title: "JEE Advanced",
      subject: "Chemistry",
      targetExam: "JEE Advanced",
      totalSessions: 25,
      sessionDurationMinutes: 90,
      priceINR: 4999,
      maxStudents: 30,
      startDate: new Date().toISOString().slice(0, 10),
      sessionTime: "18:00",
      weekDays: ["MON", "WED", "FRI"],
    }));

    expect(res.status).toBe(201);
    const course = await res.json();
    expect(course.sessions).toHaveLength(25);

    const count = await prisma.session.count({ where: { groupCourseId: course.id } });
    expect(count).toBe(25);
    expect(course.status).toBe("DRAFT");
  });

  it("rejects a non-teacher", async () => {
    const id = uid();
    const student = await prisma.user.create({
      data: { name: `${P} Student`, phone: phone(), email: `${id}@example.test`, role: "STUDENT", status: "ACTIVE" },
    });
    const sid = await createSession(student.id);
    const res = await POST(req(sid, {
      title: "x", subject: "Physics", totalSessions: 5, sessionDurationMinutes: 60,
      priceINR: 100, startDate: new Date().toISOString().slice(0, 10), sessionTime: "18:00", weekDays: ["MON"],
    }));
    expect(res.status).toBe(401);
  });
});
