import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { createMeetSession } from "@/lib/calendar";

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { packageId?: number; scheduledAt?: string };
  const { packageId, scheduledAt: scheduledAtStr } = body;

  if (!packageId) return NextResponse.json({ error: "packageId required" }, { status: 400 });
  if (!scheduledAtStr) return NextResponse.json({ error: "scheduledAt required" }, { status: 400 });

  const scheduledAt = new Date(scheduledAtStr);
  if (isNaN(scheduledAt.getTime())) {
    return NextResponse.json({ error: "scheduledAt is not a valid date" }, { status: 400 });
  }
  if (scheduledAt <= new Date()) {
    return NextResponse.json({ error: "scheduledAt must be in the future" }, { status: 400 });
  }

  const pkg = await prisma.oneOnOnePackage.findUnique({ where: { id: packageId } });
  if (!pkg || pkg.status !== "LISTED") {
    return NextResponse.json({ error: "Package not available" }, { status: 404 });
  }

  const existing = await prisma.booking.findFirst({
    where: { studentId: user.id, oneOnOnePackageId: packageId, status: "ACTIVE" },
  });
  if (existing) {
    return NextResponse.json({ error: "Already booked" }, { status: 409 });
  }

  let meetLink: string | null = null;
  let calendarEventId: string | null = null;

  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    const teacher = await prisma.user.findUnique({
      where: { id: pkg.teacherId },
      select: { email: true, name: true },
    });
    const student = await prisma.user.findUnique({
      where: { id: user.id },
      select: { email: true },
    });
    try {
      const meet = await createMeetSession({
        summary: `${pkg.title} — Session 1`,
        startTime: scheduledAt,
        durationMinutes: pkg.sessionDurationMinutes,
        attendeeEmails: [teacher?.email, student?.email].filter(Boolean) as string[],
      });
      meetLink = meet.meetLink;
      calendarEventId = meet.calendarEventId;
    } catch {
      // Calendar not configured — proceed without Meet link
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        studentId: user.id,
        courseType: "ONE_ON_ONE",
        oneOnOnePackageId: packageId,
        totalSessions: pkg.totalSessions,
        sessionsRemaining: pkg.totalSessions - 1,
        sessionsScheduled: 1,
        status: "ACTIVE",
      },
    });

    const session = await tx.session.create({
      data: {
        bookingId: booking.id,
        sessionNumber: 1,
        scheduledAt,
        durationMinutes: pkg.sessionDurationMinutes,
        meetLink,
        calendarEventId,
        status: "SCHEDULED",
      },
    });

    return { booking, session };
  });

  return NextResponse.json(result, { status: 201 });
}
