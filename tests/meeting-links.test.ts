import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { PATCH as patchCourse } from "@/app/api/teacher/courses/group/[id]/route";
import { PATCH as decideApplication } from "@/app/api/teacher/applications/[id]/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const P = "__test_meetlink__";
let seq = 0;
const uid = () => `${P}_${Date.now()}_${++seq}`;
const phone = () => `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`;

async function makeUser(role: "TEACHER" | "STUDENT") {
  return prisma.user.create({
    data: { name: `${P} ${role}`, phone: phone(), email: `${uid()}@test.invalid`, role, status: "ACTIVE" },
  });
}

async function makeCourse(teacherId: number, sessions = 3) {
  const course = await prisma.groupCourse.create({
    data: {
      teacherId, title: `${P} Course`, subject: "Chemistry", totalSessions: sessions,
      sessionDurationMinutes: 60, priceINR: 1000, maxStudents: 10,
      startDate: new Date(), status: "LISTED",
    },
  });
  await prisma.session.createMany({
    data: Array.from({ length: sessions }, (_, i) => ({
      groupCourseId: course.id, sessionNumber: i + 1,
      scheduledAt: new Date(Date.now() + (i + 1) * 86400000), durationMinutes: 60, status: "SCHEDULED" as const,
    })),
  });
  return course;
}

const req = (url: string, body: unknown, sid: string) =>
  new NextRequest(`http://localhost${url}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE}=${sid}` },
    body: JSON.stringify(body),
  });

afterEach(async () => {
  await prisma.session.deleteMany({ where: { groupCourse: { teacher: { name: { startsWith: P } } } } });
  await prisma.booking.deleteMany({ where: { OR: [{ student: { name: { startsWith: P } } }, { groupCourse: { teacher: { name: { startsWith: P } } } }] } });
  await prisma.groupCourse.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

describe("teacher sets a meeting link on a course", () => {
  it("applies the link to every session of the course", async () => {
    const t = await makeUser("TEACHER");
    const c = await makeCourse(t.id, 3);
    const sid = await createSession(t.id);

    const res = await patchCourse(
      req(`/api/teacher/courses/group/${c.id}`, { action: "set-meeting-link", meetingLink: "https://meet.google.com/abc-defg-hij" }, sid),
      { params: Promise.resolve({ id: String(c.id) }) },
    );
    expect(res.status).toBe(200);
    expect((await res.json()).sessionsUpdated).toBe(3);

    const sessions = await prisma.session.findMany({ where: { groupCourseId: c.id } });
    expect(sessions).toHaveLength(3);
    expect(sessions.every((s) => s.meetLink === "https://meet.google.com/abc-defg-hij")).toBe(true);
  });

  it("rejects a malformed link and clears on empty", async () => {
    const t = await makeUser("TEACHER");
    const c = await makeCourse(t.id, 2);
    const sid = await createSession(t.id);

    const bad = await patchCourse(
      req(`/api/teacher/courses/group/${c.id}`, { action: "set-meeting-link", meetingLink: "not a url" }, sid),
      { params: Promise.resolve({ id: String(c.id) }) },
    );
    expect(bad.status).toBe(400);

    await patchCourse(
      req(`/api/teacher/courses/group/${c.id}`, { action: "set-meeting-link", meetingLink: "https://zoom.us/j/123" }, sid),
      { params: Promise.resolve({ id: String(c.id) }) },
    );
    const cleared = await patchCourse(
      req(`/api/teacher/courses/group/${c.id}`, { action: "set-meeting-link", meetingLink: "" }, sid),
      { params: Promise.resolve({ id: String(c.id) }) },
    );
    expect(cleared.status).toBe(200);
    const sessions = await prisma.session.findMany({ where: { groupCourseId: c.id } });
    expect(sessions.every((s) => s.meetLink === null)).toBe(true);
  });

  it("refuses a teacher who does not own the course", async () => {
    const owner = await makeUser("TEACHER");
    const other = await makeUser("TEACHER");
    const c = await makeCourse(owner.id, 1);
    const sid = await createSession(other.id);

    const res = await patchCourse(
      req(`/api/teacher/courses/group/${c.id}`, { action: "set-meeting-link", meetingLink: "https://meet.google.com/x" }, sid),
      { params: Promise.resolve({ id: String(c.id) }) },
    );
    expect(res.status).toBe(404);
    const s = await prisma.session.findFirst({ where: { groupCourseId: c.id } });
    expect(s!.meetLink).toBeNull();
  });
});

describe("approval activates the booking (and triggers the enrolment email)", () => {
  it("flips PENDING -> ACTIVE so the student can reach the meeting link", async () => {
    const t = await makeUser("TEACHER");
    const s = await makeUser("STUDENT");
    const c = await makeCourse(t.id, 2);
    const sid = await createSession(t.id);

    await patchCourse(
      req(`/api/teacher/courses/group/${c.id}`, { action: "set-meeting-link", meetingLink: "https://meet.google.com/zzz" }, sid),
      { params: Promise.resolve({ id: String(c.id) }) },
    );

    const booking = await prisma.booking.create({
      data: {
        studentId: s.id, groupCourseId: c.id, status: "PENDING", courseType: "GROUP",
        totalSessions: 2, sessionsRemaining: 2,
      },
    });

    const res = await decideApplication(
      req(`/api/teacher/applications/${booking.id}`, { action: "approve" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(200);

    const after = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(after!.status).toBe("ACTIVE");
    // seat taken
    const course = await prisma.groupCourse.findUnique({ where: { id: c.id } });
    expect(course!.enrolledCount).toBe(1);
  });

  it("rejecting leaves the booking CANCELLED and takes no seat", async () => {
    const t = await makeUser("TEACHER");
    const s = await makeUser("STUDENT");
    const c = await makeCourse(t.id, 1);
    const sid = await createSession(t.id);
    const booking = await prisma.booking.create({
      data: { studentId: s.id, groupCourseId: c.id, status: "PENDING", courseType: "GROUP", totalSessions: 1, sessionsRemaining: 1 },
    });

    const res = await decideApplication(
      req(`/api/teacher/applications/${booking.id}`, { action: "reject" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(200);
    expect((await prisma.booking.findUnique({ where: { id: booking.id } }))!.status).toBe("CANCELLED");
    expect((await prisma.groupCourse.findUnique({ where: { id: c.id } }))!.enrolledCount).toBe(0);
  });
});
