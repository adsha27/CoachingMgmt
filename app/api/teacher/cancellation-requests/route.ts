import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    reason?: string;
    sessionId?: number;
    groupCourseId?: number;
    oneOnOnePackageId?: number;
  };

  const { reason, sessionId, groupCourseId, oneOnOnePackageId } = body;

  if (!reason?.trim()) return NextResponse.json({ error: "reason is required" }, { status: 400 });

  const targets = [sessionId, groupCourseId, oneOnOnePackageId].filter(Boolean);
  if (targets.length !== 1) {
    return NextResponse.json(
      { error: "Provide exactly one of: sessionId, groupCourseId, oneOnOnePackageId" },
      { status: 400 },
    );
  }

  // Ownership check
  if (sessionId) {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        groupCourse: { select: { teacherId: true } },
        booking: { include: { oneOnOnePackage: { select: { teacherId: true } } } },
      },
    });
    if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    const teacherId = session.groupCourse?.teacherId ?? session.booking?.oneOnOnePackage?.teacherId;
    if (teacherId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (session.status !== "SCHEDULED") {
      return NextResponse.json({ error: "Session is not scheduled" }, { status: 409 });
    }
  }

  if (groupCourseId) {
    const course = await prisma.groupCourse.findUnique({ where: { id: groupCourseId } });
    if (!course || course.teacherId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (oneOnOnePackageId) {
    const pkg = await prisma.oneOnOnePackage.findUnique({ where: { id: oneOnOnePackageId } });
    if (!pkg || pkg.teacherId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // No duplicate PENDING request for same target
  const existing = await prisma.cancellationRequest.findFirst({
    where: {
      teacherId: user.id,
      status: "PENDING",
      ...(sessionId ? { sessionId } : {}),
      ...(groupCourseId ? { groupCourseId } : {}),
      ...(oneOnOnePackageId ? { oneOnOnePackageId } : {}),
    },
  });
  if (existing) {
    return NextResponse.json({ error: "A pending request already exists for this item" }, { status: 409 });
  }

  const request = await prisma.cancellationRequest.create({
    data: {
      teacherId: user.id,
      reason: reason.trim(),
      sessionId: sessionId ?? null,
      groupCourseId: groupCourseId ?? null,
      oneOnOnePackageId: oneOnOnePackageId ?? null,
      status: "PENDING",
    },
  });

  return NextResponse.json(request, { status: 201 });
}
