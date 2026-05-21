import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { cancelCalendarEvent } from "@/lib/calendar";
import { sendEmail } from "@/lib/email";
import {
  SessionCancelledEmail,
  sessionCancelledText,
} from "@/lib/emails/session-cancelled";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;

  const session = await prisma.session.findUnique({ where: { id: Number(id) } });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "SCHEDULED") {
    return NextResponse.json({ error: "Only SCHEDULED sessions can be marked complete" }, { status: 409 });
  }

  const updated = await prisma.session.update({
    where: { id: Number(id) },
    data: { status: "COMPLETED" },
  });
  return NextResponse.json({ session: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const reason = (body as { reason?: string }).reason;

  const session = await prisma.session.findUnique({
    where: { id: Number(id) },
    include: {
      teacher: true,
      students: { include: { student: true } },
    },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  if (session.status === "CANCELLED") {
    return NextResponse.json({ error: "Session already cancelled" }, { status: 409 });
  }

  // Best-effort Calendar cancellation — don't block if it fails
  if (session.calendarEventId) {
    try {
      await cancelCalendarEvent(session.calendarEventId);
    } catch {
      console.error(`Calendar cancel failed for event ${session.calendarEventId}`);
    }
  }

  const cancelled = await prisma.session.update({
    where: { id: Number(id) },
    data: { status: "CANCELLED", cancelReason: reason ?? null },
  });

  // Cancellation email — non-fatal
  let emailError: string | null = null;
  const allEmails = [
    session.teacher.email,
    ...session.students.map((ss) => ss.student.email),
  ];
  const emailProps = {
    subject: session.subject,
    scheduledDate: session.scheduledDate,
    reason,
  };
  try {
    const html = await render(<SessionCancelledEmail {...emailProps} />);
    await sendEmail({
      to: allEmails,
      subject: `Session cancelled: ${session.subject}`,
      html,
      text: sessionCancelledText(emailProps),
    });
  } catch (err) {
    emailError = err instanceof Error ? err.message : "Email failed";
    await prisma.session.update({
      where: { id: Number(id) },
      data: { emailError },
    });
  }

  return NextResponse.json({ session: cancelled, emailError });
}
