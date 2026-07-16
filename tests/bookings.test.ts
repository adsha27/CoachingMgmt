import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST as apply } from "@/app/api/applications/route";
import { PATCH as decideApplication } from "@/app/api/teacher/applications/[id]/route";
import { POST as createProposal } from "@/app/api/bookings/[id]/proposals/route";
import { PATCH as handleProposal } from "@/app/api/proposals/[id]/route";
import { POST as submitFeedback } from "@/app/api/sessions/[id]/feedback/route";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE } from "@/lib/auth";

const P = "__test_bookings__";
let seq = 0;
function uid() { return `${P}_${Date.now()}_${++seq}`; }
function phone() { return `9${Math.floor(100_000_000 + Math.random() * 900_000_000)}`; }

function req(method: string, url: string, body?: unknown, sid?: string) {
  return new NextRequest(`http://localhost${url}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(sid ? { Cookie: `${SESSION_COOKIE}=${sid}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

function paramReq(method: string, url: string, body?: unknown, sid?: string) {
  return req(method, url, body, sid);
}

async function makeUser(role: "ADMIN" | "TEACHER" | "STUDENT") {
  const id = uid();
  return prisma.user.create({
    data: { name: `${P} ${role}`, phone: phone(), email: `${id}@test.invalid`, role },
  });
}

async function makeTeacher() {
  const t = await makeUser("TEACHER");
  return t;
}

async function makePackage(teacherId: number, overrides: Partial<{
  status: string; totalSessions: number; priceINR: number;
}> = {}) {
  return prisma.oneOnOnePackage.create({
    data: {
      teacherId,
      title: `${uid()} Package`,
      subject: "Physics",
      totalSessions: overrides.totalSessions ?? 5,
      sessionDurationMinutes: 60,
      priceINR: overrides.priceINR ?? 500,
      status: (overrides.status ?? "LISTED") as "LISTED" | "DRAFT" | "CLOSED",
    },
  });
}

async function makeCourse(teacherId: number, overrides: Partial<{
  status: string; maxStudents: number;
}> = {}) {
  return prisma.groupCourse.create({
    data: {
      teacherId,
      title: `${uid()} Course`,
      subject: "Chemistry",
      totalSessions: 10,
      sessionDurationMinutes: 90,
      priceINR: 2000,
      maxStudents: overrides.maxStudents ?? 30,
      enrolledCount: 0,
      startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: (overrides.status ?? "LISTED") as "LISTED" | "DRAFT" | "CLOSED" | "FULL",
    },
  });
}

async function makeBookingWithSession(studentId: number, packageId: number, sessionsRemaining = 3) {
  const booking = await prisma.booking.create({
    data: {
      studentId,
      courseType: "ONE_ON_ONE",
      oneOnOnePackageId: packageId,
      totalSessions: 5,
      sessionsRemaining,
      sessionsCompleted: 5 - sessionsRemaining - 1,
      sessionsScheduled: 1,
      status: "ACTIVE",
    },
  });
  await prisma.session.create({
    data: {
      bookingId: booking.id,
      sessionNumber: 1,
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      durationMinutes: 60,
      status: "SCHEDULED",
    },
  });
  return booking;
}

afterEach(async () => {
  await prisma.sessionFeedback.deleteMany({ where: { student: { name: { startsWith: P } } } });
  await prisma.slotProposal.deleteMany({ where: { booking: { student: { name: { startsWith: P } } } } });
  await prisma.session.deleteMany({
    where: {
      OR: [
        { booking: { student: { name: { startsWith: P } } } },
        { groupCourse: { teacher: { name: { startsWith: P } } } },
      ],
    },
  });
  await prisma.booking.deleteMany({ where: { student: { name: { startsWith: P } } } });
  await prisma.oneOnOnePackage.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.groupCourse.deleteMany({ where: { teacher: { name: { startsWith: P } } } });
  await prisma.userSession.deleteMany({ where: { user: { name: { startsWith: P } } } });
  await prisma.user.deleteMany({ where: { name: { startsWith: P } } });
});

// ─── Applications (apply for a class) ──────────────────────────────────────────

describe("POST /api/applications", () => {
  it("creates a PENDING application without taking a seat", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const course = await makeCourse(teacher.id);
    const sid = await createSession(student.id);

    const res = await apply(req("POST", "/api/applications", { courseId: course.id }, sid));
    expect(res.status).toBe(201);

    const booking = await prisma.booking.findFirst({ where: { studentId: student.id, groupCourseId: course.id } });
    expect(booking!.status).toBe("PENDING");
    // No seat is taken until the teacher approves.
    const updated = await prisma.groupCourse.findUnique({ where: { id: course.id } });
    expect(updated!.enrolledCount).toBe(0);
  });

  it("returns 409 if the student already applied", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const course = await makeCourse(teacher.id);
    const sid = await createSession(student.id);

    await apply(req("POST", "/api/applications", { courseId: course.id }, sid));
    const res = await apply(req("POST", "/api/applications", { courseId: course.id }, sid));
    expect(res.status).toBe(409);
  });

  it("returns 404 for a DRAFT course", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const course = await makeCourse(teacher.id, { status: "DRAFT" });
    const sid = await createSession(student.id);

    const res = await apply(req("POST", "/api/applications", { courseId: course.id }, sid));
    expect(res.status).toBe(404);
  });

  it("returns 401 for unauthenticated requests", async () => {
    const teacher = await makeTeacher();
    const course = await makeCourse(teacher.id);
    const res = await apply(req("POST", "/api/applications", { courseId: course.id }));
    expect(res.status).toBe(401);
  });
});

// ─── Application approve / reject ───────────────────────────────────────────────

describe("PATCH /api/teacher/applications/[id]", () => {
  async function pendingFor(studentId: number, courseId: number) {
    return prisma.booking.create({
      data: { studentId, courseType: "GROUP", groupCourseId: courseId, totalSessions: 10, sessionsRemaining: 10, status: "PENDING" },
    });
  }

  it("teacher approves — booking goes ACTIVE and the seat is taken", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const course = await makeCourse(teacher.id);
    const booking = await pendingFor(student.id, course.id);
    const sid = await createSession(teacher.id);

    const res = await decideApplication(
      paramReq("PATCH", `/api/teacher/applications/${booking.id}`, { action: "approve" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(200);
    expect((await prisma.booking.findUnique({ where: { id: booking.id } }))!.status).toBe("ACTIVE");
    expect((await prisma.groupCourse.findUnique({ where: { id: course.id } }))!.enrolledCount).toBe(1);
  });

  it("rejecting sets the booking CANCELLED and takes no seat", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const course = await makeCourse(teacher.id);
    const booking = await pendingFor(student.id, course.id);
    const sid = await createSession(teacher.id);

    const res = await decideApplication(
      paramReq("PATCH", `/api/teacher/applications/${booking.id}`, { action: "reject" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(200);
    expect((await prisma.booking.findUnique({ where: { id: booking.id } }))!.status).toBe("CANCELLED");
    expect((await prisma.groupCourse.findUnique({ where: { id: course.id } }))!.enrolledCount).toBe(0);
  });

  it("returns 403 when another teacher tries to decide it", async () => {
    const teacher = await makeTeacher();
    const other = await makeTeacher();
    const student = await makeUser("STUDENT");
    const course = await makeCourse(teacher.id);
    const booking = await pendingFor(student.id, course.id);
    const sid = await createSession(other.id);

    const res = await decideApplication(
      paramReq("PATCH", `/api/teacher/applications/${booking.id}`, { action: "approve" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(403);
  });

  it("returns 409 when approving into a course that is already full", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const course = await makeCourse(teacher.id, { maxStudents: 1 });
    await prisma.groupCourse.update({ where: { id: course.id }, data: { enrolledCount: 1 } });
    const booking = await pendingFor(student.id, course.id);
    const sid = await createSession(teacher.id);

    const res = await decideApplication(
      paramReq("PATCH", `/api/teacher/applications/${booking.id}`, { action: "approve" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(409);
  });
});

// ─── Slot Proposals ───────────────────────────────────────────────────────────

describe("POST /api/bookings/[id]/proposals", () => {
  it("creates a pending slot proposal", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    const booking = await makeBookingWithSession(student.id, pkg.id);
    const sid = await createSession(student.id);
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const res = await createProposal(
      paramReq("POST", `/api/bookings/${booking.id}/proposals`, { proposedDate: futureDate, proposedStartTime: "10:00" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.status).toBe("PENDING");
  });

  it("returns 409 if a pending proposal already exists", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    const booking = await makeBookingWithSession(student.id, pkg.id);
    const sid = await createSession(student.id);
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    await createProposal(
      paramReq("POST", `/api/bookings/${booking.id}/proposals`, { proposedDate: futureDate, proposedStartTime: "10:00" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    const res = await createProposal(
      paramReq("POST", `/api/bookings/${booking.id}/proposals`, { proposedDate: futureDate, proposedStartTime: "11:00" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(409);
  });

  it("returns 409 when no sessions remaining", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    const booking = await makeBookingWithSession(student.id, pkg.id, 0);
    const sid = await createSession(student.id);
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const res = await createProposal(
      paramReq("POST", `/api/bookings/${booking.id}/proposals`, { proposedDate: futureDate, proposedStartTime: "10:00" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(409);
  });

  it("returns 404 if booking belongs to another student", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const other = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    const booking = await makeBookingWithSession(student.id, pkg.id);
    const sid = await createSession(other.id);
    const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const res = await createProposal(
      paramReq("POST", `/api/bookings/${booking.id}/proposals`, { proposedDate: futureDate, proposedStartTime: "10:00" }, sid),
      { params: Promise.resolve({ id: String(booking.id) }) },
    );
    expect(res.status).toBe(404);
  });
});

// ─── Proposal Confirm / Reject ────────────────────────────────────────────────

describe("PATCH /api/proposals/[id]", () => {
  async function makeProposal(bookingId: number) {
    return prisma.slotProposal.create({
      data: {
        bookingId,
        proposedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        proposedStartTime: "10:00",
        status: "PENDING",
      },
    });
  }

  it("teacher confirms proposal — creates session, decrements sessionsRemaining", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    const booking = await makeBookingWithSession(student.id, pkg.id);
    const proposal = await makeProposal(booking.id);
    const sid = await createSession(teacher.id);

    const res = await handleProposal(
      paramReq("PATCH", `/api/proposals/${proposal.id}`, { action: "confirm" }, sid),
      { params: Promise.resolve({ id: String(proposal.id) }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.proposal.status).toBe("CONFIRMED");
    expect(data.session.id).toBeDefined();

    const updated = await prisma.booking.findUnique({ where: { id: booking.id } });
    expect(updated!.sessionsRemaining).toBe(booking.sessionsRemaining - 1);
  });

  it("teacher rejects proposal with a note", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    const booking = await makeBookingWithSession(student.id, pkg.id);
    const proposal = await makeProposal(booking.id);
    const sid = await createSession(teacher.id);

    const res = await handleProposal(
      paramReq("PATCH", `/api/proposals/${proposal.id}`, { action: "reject", teacherNote: "Not available then" }, sid),
      { params: Promise.resolve({ id: String(proposal.id) }) },
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("REJECTED");
    expect(data.teacherNote).toBe("Not available then");
  });

  it("returns 403 if another teacher tries to act on it", async () => {
    const teacher = await makeTeacher();
    const other = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    const booking = await makeBookingWithSession(student.id, pkg.id);
    const proposal = await makeProposal(booking.id);
    const sid = await createSession(other.id);

    const res = await handleProposal(
      paramReq("PATCH", `/api/proposals/${proposal.id}`, { action: "confirm" }, sid),
      { params: Promise.resolve({ id: String(proposal.id) }) },
    );
    expect(res.status).toBe(403);
  });

  it("returns 409 if proposal already processed", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    const booking = await makeBookingWithSession(student.id, pkg.id);
    const proposal = await makeProposal(booking.id);
    const sid = await createSession(teacher.id);

    await handleProposal(
      paramReq("PATCH", `/api/proposals/${proposal.id}`, { action: "reject", teacherNote: "busy" }, sid),
      { params: Promise.resolve({ id: String(proposal.id) }) },
    );
    const res = await handleProposal(
      paramReq("PATCH", `/api/proposals/${proposal.id}`, { action: "confirm" }, sid),
      { params: Promise.resolve({ id: String(proposal.id) }) },
    );
    expect(res.status).toBe(409);
  });
});

// ─── Session Feedback ─────────────────────────────────────────────────────────

describe("POST /api/sessions/[id]/feedback", () => {
  async function makeCompletedSession(studentId: number, packageId: number) {
    const booking = await prisma.booking.create({
      data: {
        studentId,
        courseType: "ONE_ON_ONE",
        oneOnOnePackageId: packageId,
        totalSessions: 5,
        sessionsRemaining: 4,
        sessionsCompleted: 1,
        sessionsScheduled: 0,
        status: "ACTIVE",
      },
    });
    return prisma.session.create({
      data: {
        bookingId: booking.id,
        sessionNumber: 1,
        scheduledAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        durationMinutes: 60,
        status: "COMPLETED",
      },
    });
  }

  it("submits feedback and updates teacher rating", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    await prisma.teacherProfile.create({ data: { teacherId: teacher.id, subjects: [], targetExams: [] } });
    const session = await makeCompletedSession(student.id, pkg.id);
    const sid = await createSession(student.id);

    const res = await submitFeedback(
      paramReq("POST", `/api/sessions/${session.id}/feedback`, { rating: 5, comment: "Excellent!" }, sid),
      { params: Promise.resolve({ id: String(session.id) }) },
    );
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.rating).toBe(5);

    const profile = await prisma.teacherProfile.findUnique({ where: { teacherId: teacher.id } });
    expect(profile!.rating).toBeCloseTo(5);
  });

  it("returns 409 if feedback already submitted", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    await prisma.teacherProfile.create({ data: { teacherId: teacher.id, subjects: [], targetExams: [] } });
    const session = await makeCompletedSession(student.id, pkg.id);
    const sid = await createSession(student.id);

    await submitFeedback(
      paramReq("POST", `/api/sessions/${session.id}/feedback`, { rating: 4 }, sid),
      { params: Promise.resolve({ id: String(session.id) }) },
    );
    const res = await submitFeedback(
      paramReq("POST", `/api/sessions/${session.id}/feedback`, { rating: 3 }, sid),
      { params: Promise.resolve({ id: String(session.id) }) },
    );
    expect(res.status).toBe(409);
  });

  it("returns 409 for a non-completed session", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    const booking = await makeBookingWithSession(student.id, pkg.id);
    const session = await prisma.session.findFirst({ where: { bookingId: booking.id } });
    const sid = await createSession(student.id);

    const res = await submitFeedback(
      paramReq("POST", `/api/sessions/${session!.id}/feedback`, { rating: 4 }, sid),
      { params: Promise.resolve({ id: String(session!.id) }) },
    );
    expect(res.status).toBe(409);
  });

  it("returns 400 for out-of-range rating", async () => {
    const teacher = await makeTeacher();
    const student = await makeUser("STUDENT");
    const pkg = await makePackage(teacher.id);
    await prisma.teacherProfile.create({ data: { teacherId: teacher.id, subjects: [], targetExams: [] } });
    const session = await makeCompletedSession(student.id, pkg.id);
    const sid = await createSession(student.id);

    const res = await submitFeedback(
      paramReq("POST", `/api/sessions/${session.id}/feedback`, { rating: 6 }, sid),
      { params: Promise.resolve({ id: String(session.id) }) },
    );
    expect(res.status).toBe(400);
  });
});
