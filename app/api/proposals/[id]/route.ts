import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { render } from "@react-email/render";
import { SlotConfirmedEmail, slotConfirmedText } from "@/lib/emails/slot-confirmed";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const proposalId = Number(id);

  const proposal = await prisma.slotProposal.findUnique({
    where: { id: proposalId },
    include: {
      booking: {
        include: {
          student: { select: { id: true, name: true, email: true } },
          oneOnOnePackage: { include: { teacher: { select: { id: true, email: true } } } },
        },
      },
    },
  });

  if (!proposal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (proposal.booking.oneOnOnePackage?.teacher.id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (proposal.status !== "PENDING") {
    return NextResponse.json({ error: "Proposal already processed" }, { status: 409 });
  }

  const body = await req.json() as { action?: "confirm" | "reject"; teacherNote?: string };
  const { action, teacherNote } = body;

  if (!action || !["confirm", "reject"].includes(action)) {
    return NextResponse.json({ error: "action must be 'confirm' or 'reject'" }, { status: 400 });
  }

  if (action === "reject") {
    const updated = await prisma.slotProposal.update({
      where: { id: proposalId },
      data: { status: "REJECTED", teacherNote: teacherNote ?? null },
    });
    return NextResponse.json(updated);
  }

  // Confirm: create the session, carrying the teacher's own meeting link.
  const pkg = proposal.booking.oneOnOnePackage!;
  const scheduledAt = new Date(proposal.proposedDate);
  const [h, m] = proposal.proposedStartTime.split(":").map(Number);
  scheduledAt.setHours(h, m, 0, 0);

  // The teacher supplies the link on the package; no calendar integration.
  const meetLink: string | null = pkg.meetingLink ?? null;
  const calendarEventId: string | null = null;

  const booking = proposal.booking;
  const nextSessionNumber = booking.sessionsCompleted + booking.sessionsScheduled + 1;

  const result = await prisma.$transaction(async (tx) => {
    const updatedProposal = await tx.slotProposal.update({
      where: { id: proposalId },
      data: { status: "CONFIRMED", teacherNote: teacherNote ?? null },
    });

    const session = await tx.session.create({
      data: {
        bookingId: booking.id,
        sessionNumber: nextSessionNumber,
        scheduledAt,
        durationMinutes: pkg.sessionDurationMinutes,
        meetLink,
        calendarEventId,
        status: "SCHEDULED",
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: {
        sessionsScheduled: { increment: 1 },
        sessionsRemaining: { decrement: 1 },
      },
    });

    return { proposal: updatedProposal, session };
  });

  // Send confirmation email (best-effort)
  const confirmedDateStr = scheduledAt.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const confirmedTimeStr = proposal.proposedStartTime;
  const emailProps = {
    studentName: proposal.booking.student.name ?? "Student",
    teacherName: user.name ?? "Teacher",
    packageTitle: pkg.title,
    confirmedDate: confirmedDateStr,
    confirmedTime: confirmedTimeStr,
    durationMinutes: pkg.sessionDurationMinutes,
    meetLink,
    teacherNote: teacherNote?.trim() || undefined,
  };
  if (proposal.booking.student.email) {
    (async () => {
      await sendEmail({
        to: proposal.booking.student.email!,
        subject: `Session confirmed — ${confirmedDateStr} at ${confirmedTimeStr}`,
        html: await render(SlotConfirmedEmail(emailProps) as React.ReactElement),
        text: slotConfirmedText(emailProps),
      });
    })().catch(() => {});
  }

  return NextResponse.json(result);
}
