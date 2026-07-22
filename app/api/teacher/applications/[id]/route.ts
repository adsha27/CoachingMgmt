import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { EnrolmentConfirmedEmail, enrolmentConfirmedText } from "@/lib/emails/enrolment-confirmed";

// Sends the "you're enrolled" email carrying the teacher's meeting link.
// Best-effort: a delivery failure must never roll back a confirmed enrolment.
async function sendEnrolmentEmail(bookingId: number, teacherName: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: { select: { name: true, email: true } },
      groupCourse: { select: { title: true, sessions: { orderBy: { scheduledAt: "asc" }, take: 1, select: { meetLink: true, scheduledAt: true } } } },
      oneOnOnePackage: { select: { title: true } },
    },
  });
  if (!b?.student.email) return;

  const first = b.groupCourse?.sessions[0];
  const props = {
    studentName: b.student.name ?? "there",
    className: b.groupCourse?.title ?? b.oneOnOnePackage?.title ?? "your class",
    teacherName,
    meetingLink: first?.meetLink ?? null,
    firstSessionAt: first
      ? new Date(first.scheduledAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
      : null,
  };

  await sendEmail({
    to: b.student.email,
    subject: `You're enrolled in ${props.className}`,
    html: await render(EnrolmentConfirmedEmail(props) as React.ReactElement),
    text: enrolmentConfirmedText(props),
  });
}

// Teacher approves or rejects a PENDING application (Booking) for one of their
// own classes. Approving a group course is where the seat is actually taken.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bookingId = Number((await params).id);
  const { action } = await req.json() as { action?: "approve" | "reject" };
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { groupCourse: true, oneOnOnePackage: true },
  });
  if (!booking || booking.status !== "PENDING") {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  // Ownership: the class must belong to this teacher.
  const ownerId = booking.groupCourse?.teacherId ?? booking.oneOnOnePackage?.teacherId;
  if (ownerId !== user.id) {
    return NextResponse.json({ error: "Not your class" }, { status: 403 });
  }

  if (action === "reject") {
    await prisma.booking.update({ where: { id: booking.id }, data: { status: "CANCELLED" } });
    return NextResponse.json({ ok: true });
  }

  // Approve a group course: take a seat atomically, only if room remains.
  if (booking.groupCourse) {
    const course = booking.groupCourse;
    const approved = await prisma.$transaction(async (tx) => {
      const seated = await tx.groupCourse.updateManyAndReturn({
        where: { id: course.id, enrolledCount: { lt: course.maxStudents } },
        data: { enrolledCount: { increment: 1 } },
      });
      if (seated.length === 0) return false;
      if (seated[0].enrolledCount >= course.maxStudents) {
        await tx.groupCourse.update({ where: { id: course.id }, data: { status: "FULL" } });
      }
      await tx.booking.update({ where: { id: booking.id }, data: { status: "ACTIVE" } });
      return true;
    });
    if (!approved) return NextResponse.json({ error: "Course is now full" }, { status: 409 });
    await sendEnrolmentEmail(booking.id, user.name ?? "your teacher").catch(() => {});
    return NextResponse.json({ ok: true });
  }

  // 1-on-1: approving just activates; slot scheduling happens afterward.
  await prisma.booking.update({ where: { id: booking.id }, data: { status: "ACTIVE" } });
  await sendEnrolmentEmail(booking.id, user.name ?? "your teacher").catch(() => {});
  return NextResponse.json({ ok: true });
}
