import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const sessionId = Number(id);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: {
      groupCourse: { select: { bookings: { where: { studentId: user.id, status: "ACTIVE" }, take: 1 } } },
      booking: { select: { studentId: true } },
    },
  });

  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.status !== "COMPLETED") {
    return NextResponse.json({ error: "Feedback can only be submitted for completed sessions" }, { status: 409 });
  }

  // Verify student has access to this session
  const isStudent1on1 = session.booking?.studentId === user.id;
  const isStudentGroup = (session.groupCourse?.bookings?.length ?? 0) > 0;
  if (!isStudent1on1 && !isStudentGroup) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existing = await prisma.sessionFeedback.findUnique({
    where: { sessionId_studentId: { sessionId, studentId: user.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Feedback already submitted" }, { status: 409 });
  }

  const body = await req.json() as { rating?: number; comment?: string };
  const { rating, comment } = body;

  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    return NextResponse.json({ error: "rating must be an integer 1–5" }, { status: 400 });
  }

  const feedback = await prisma.$transaction(async (tx) => {
    const created = await tx.sessionFeedback.create({
      data: { sessionId, studentId: user.id, rating, comment: comment?.trim() || null },
    });

    // Recalculate teacher's average rating
    // Find the teacher via the session's course/booking
    const fullSession = await tx.session.findUnique({
      where: { id: sessionId },
      include: {
        groupCourse: { select: { teacherId: true } },
        booking: { include: { oneOnOnePackage: { select: { teacherId: true } } } },
      },
    });
    const teacherId = fullSession?.groupCourse?.teacherId ?? fullSession?.booking?.oneOnOnePackage?.teacherId;

    if (teacherId) {
      const agg = await tx.sessionFeedback.aggregate({
        where: {
          session: {
            OR: [
              { groupCourse: { teacherId } },
              { booking: { oneOnOnePackage: { teacherId } } },
            ],
          },
        },
        _avg: { rating: true },
        _count: true,
      });
      if (agg._avg.rating !== null) {
        await tx.teacherProfile.update({
          where: { teacherId },
          data: { rating: agg._avg.rating },
        });
      }
    }

    return created;
  });

  return NextResponse.json(feedback, { status: 201 });
}
