import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { BookingConfirmedGroupEmail, bookingConfirmedGroupText } from "@/lib/emails/booking-confirmed-group";
import { BookingConfirmedTeacherEmail, bookingConfirmedTeacherText } from "@/lib/emails/booking-confirmed-teacher";

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { courseId?: number };
  const { courseId } = body;

  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const course = await prisma.groupCourse.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { name: true, email: true } },
      sessions: { where: { status: "SCHEDULED" }, orderBy: { scheduledAt: "asc" }, take: 1 },
    },
  });
  if (!course || course.status !== "LISTED") {
    return NextResponse.json({ error: "Course not available" }, { status: 404 });
  }

  const existing = await prisma.booking.findFirst({
    where: { studentId: user.id, groupCourseId: courseId, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json({ error: "Already enrolled" }, { status: 409 });
  }

  // Atomic capacity check + increment: the WHERE condition ensures we only
  // increment if there is still room, preventing double-booking under concurrency.
  let newEnrolled = 0;
  const booking = await prisma.$transaction(async (tx) => {
    const updated = await tx.groupCourse.updateManyAndReturn({
      where: { id: courseId, enrolledCount: { lt: course.maxStudents }, status: "LISTED" },
      data: { enrolledCount: { increment: 1 } },
    });
    if (updated.length === 0) {
      throw Object.assign(new Error("Course is full"), { code: "COURSE_FULL" });
    }
    newEnrolled = updated[0].enrolledCount;
    if (newEnrolled >= course.maxStudents) {
      await tx.groupCourse.update({ where: { id: courseId }, data: { status: "FULL" } });
    }
    return tx.booking.create({
      data: {
        studentId: user.id,
        courseType: "GROUP",
        groupCourseId: courseId,
        totalSessions: course.totalSessions,
        sessionsRemaining: course.totalSessions,
        status: "ACTIVE",
      },
    });
  }).catch((err: Error & { code?: string }) => {
    if (err.code === "COURSE_FULL") return null;
    throw err;
  });

  if (!booking) {
    return NextResponse.json({ error: "Course is full" }, { status: 409 });
  }

  // Send confirmation emails (non-blocking, best-effort)
  const firstSession = course.sessions[0];
  const firstSessionDate = firstSession
    ? new Date(firstSession.scheduledAt).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })
    : undefined;
  const emailProps = {
    studentName: user.name ?? "Student",
    courseTitle: course.title,
    teacherName: course.teacher.name ?? "Teacher",
    subject: course.subject,
    totalSessions: course.totalSessions,
    priceINR: course.priceINR,
    firstSessionDate,
  };

  (async () => {
    const teacherProps = { teacherName: course.teacher.name ?? "Teacher", studentName: user.name ?? "Student", courseTitle: course.title, enrolledCount: newEnrolled, maxStudents: course.maxStudents };
    await Promise.all([
      user.email && sendEmail({
        to: user.email,
        subject: `Enrolled in ${course.title}`,
        html: await render(BookingConfirmedGroupEmail(emailProps) as React.ReactElement),
        text: bookingConfirmedGroupText(emailProps),
      }),
      course.teacher.email && sendEmail({
        to: course.teacher.email,
        subject: `New student enrolled in ${course.title}`,
        html: await render(BookingConfirmedTeacherEmail(teacherProps) as React.ReactElement),
        text: bookingConfirmedTeacherText(teacherProps),
      }),
    ]);
  })().catch(() => {});

  return NextResponse.json(booking, { status: 201 });
}
