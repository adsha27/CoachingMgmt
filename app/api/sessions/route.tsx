import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { createMeetSession } from "@/lib/calendar";
import { sendEmail } from "@/lib/email";
import {
  SessionInviteEmail,
  sessionInviteText,
} from "@/lib/emails/session-invite";

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const sessions = await prisma.session.findMany({
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      students: {
        include: { student: { select: { id: true, name: true, email: true } } },
      },
    },
    orderBy: { scheduledDate: "asc" },
  });
  return NextResponse.json(sessions);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { teacherId, subject, scheduledDate, durationMinutes, studentIds = [] } =
    body as {
      teacherId: number;
      subject: string;
      scheduledDate: string;
      durationMinutes: number;
      studentIds: number[];
    };

  if (!teacherId || !subject || !scheduledDate || !durationMinutes) {
    return NextResponse.json(
      { error: "teacherId, subject, scheduledDate, and durationMinutes are required" },
      { status: 400 }
    );
  }

  const teacher = await prisma.user.findFirst({
    where: { id: Number(teacherId), role: "TEACHER", status: "ACTIVE" },
  });
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const students = studentIds.length
    ? await prisma.user.findMany({
        where: { id: { in: studentIds.map(Number) }, role: "STUDENT" },
      })
    : [];

  const start = new Date(scheduledDate);
  const attendeeEmails = [teacher.email, ...students.map((s) => s.email)];

  // Calendar API first — failure blocks insertion (no orphaned DB rows)
  let meetLink: string;
  let calendarEventId: string;
  try {
    const meet = await createMeetSession({
      summary: `${subject} — ${teacher.name}`,
      startTime: start,
      durationMinutes: Number(durationMinutes),
      attendeeEmails,
    });
    meetLink = meet.meetLink;
    calendarEventId = meet.calendarEventId;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Calendar API failed" },
      { status: 502 }
    );
  }

  const session = await prisma.session.create({
    data: {
      teacherId: Number(teacherId),
      subject,
      scheduledDate: start,
      durationMinutes: Number(durationMinutes),
      meetLink,
      calendarEventId,
      students: { create: students.map((s) => ({ studentId: s.id })) },
    },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      students: { include: { student: { select: { id: true, name: true } } } },
    },
  });

  // Email — non-fatal; failure logged to session row for admin banner
  let emailError: string | null = null;
  const emailProps = {
    teacherName: teacher.name,
    studentNames: students.map((s) => s.name),
    subject,
    scheduledDate: start,
    durationMinutes: Number(durationMinutes),
    meetLink,
  };
  try {
    const html = await render(<SessionInviteEmail {...emailProps} />);
    await sendEmail({
      to: attendeeEmails,
      subject: `Session scheduled: ${subject}`,
      html,
      text: sessionInviteText(emailProps),
    });
    await prisma.session.update({
      where: { id: session.id },
      data: { emailSentAt: new Date() },
    });
  } catch (err) {
    emailError = err instanceof Error ? err.message : "Email failed";
    await prisma.session.update({
      where: { id: session.id },
      data: { emailError },
    });
  }

  return NextResponse.json({ session, emailError }, { status: 201 });
}
