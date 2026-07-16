import { prisma } from "@/lib/prisma";

type ApplyTarget = { groupCourseId: number } | { oneOnOnePackageId: number };
type ApplyResult = { ok: true; bookingId: number } | { ok: false; error: string; status: number };

// A "class application" is a Booking in PENDING status: no seat is taken and no
// session/Meet link is created until a teacher approves it. Shared by the
// register-and-apply path and the logged-in apply endpoint.
export async function createApplication(studentId: number, target: ApplyTarget): Promise<ApplyResult> {
  if ("groupCourseId" in target) {
    const course = await prisma.groupCourse.findUnique({ where: { id: target.groupCourseId } });
    if (!course || course.status === "DRAFT") return { ok: false, error: "Course not available", status: 404 };

    const dup = await prisma.booking.findFirst({
      where: { studentId, groupCourseId: course.id, status: { in: ["PENDING", "ACTIVE"] } },
    });
    if (dup) return { ok: false, error: "You've already applied to this course", status: 409 };

    const booking = await prisma.booking.create({
      data: {
        studentId,
        courseType: "GROUP",
        groupCourseId: course.id,
        totalSessions: course.totalSessions,
        sessionsRemaining: course.totalSessions,
        status: "PENDING",
      },
    });
    return { ok: true, bookingId: booking.id };
  }

  const pkg = await prisma.oneOnOnePackage.findUnique({ where: { id: target.oneOnOnePackageId } });
  if (!pkg || pkg.status === "DRAFT") return { ok: false, error: "Package not available", status: 404 };

  const dup = await prisma.booking.findFirst({
    where: { studentId, oneOnOnePackageId: pkg.id, status: { in: ["PENDING", "ACTIVE"] } },
  });
  if (dup) return { ok: false, error: "You've already applied to this package", status: 409 };

  const booking = await prisma.booking.create({
    data: {
      studentId,
      courseType: "ONE_ON_ONE",
      oneOnOnePackageId: pkg.id,
      totalSessions: pkg.totalSessions,
      sessionsRemaining: pkg.totalSessions,
      status: "PENDING",
    },
  });
  return { ok: true, bookingId: booking.id };
}
