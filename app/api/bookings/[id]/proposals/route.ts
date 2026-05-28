import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const bookingId = Number(id);

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only the student or the teacher of the package can view proposals
  if (user.role === "STUDENT" && booking.studentId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (user.role === "TEACHER") {
    const pkg = booking.oneOnOnePackageId
      ? await prisma.oneOnOnePackage.findUnique({ where: { id: booking.oneOnOnePackageId } })
      : null;
    if (!pkg || pkg.teacherId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const proposals = await prisma.slotProposal.findMany({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(proposals);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const bookingId = Number(id);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { oneOnOnePackage: true },
  });
  if (!booking || booking.studentId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (booking.courseType !== "ONE_ON_ONE") {
    return NextResponse.json({ error: "Proposals only apply to 1-on-1 bookings" }, { status: 400 });
  }
  if (booking.status !== "ACTIVE") {
    return NextResponse.json({ error: "Booking is not active" }, { status: 409 });
  }
  if (booking.sessionsRemaining <= 0) {
    return NextResponse.json({ error: "No sessions remaining" }, { status: 409 });
  }

  // Only one PENDING proposal at a time
  const pending = await prisma.slotProposal.findFirst({
    where: { bookingId, status: "PENDING" },
  });
  if (pending) {
    return NextResponse.json({ error: "A pending proposal already exists. Wait for teacher response." }, { status: 409 });
  }

  const body = await req.json() as { proposedDate?: string; proposedStartTime?: string };
  const { proposedDate, proposedStartTime } = body;

  if (!proposedDate) return NextResponse.json({ error: "proposedDate required (YYYY-MM-DD)" }, { status: 400 });
  if (!proposedStartTime || !/^\d{2}:\d{2}$/.test(proposedStartTime)) {
    return NextResponse.json({ error: "proposedStartTime required (HH:MM)" }, { status: 400 });
  }

  const date = new Date(proposedDate);
  if (isNaN(date.getTime())) return NextResponse.json({ error: "proposedDate is invalid" }, { status: 400 });
  if (date <= new Date()) return NextResponse.json({ error: "proposedDate must be in the future" }, { status: 400 });

  const proposal = await prisma.slotProposal.create({
    data: {
      bookingId,
      proposedDate: date,
      proposedStartTime,
      status: "PENDING",
    },
  });

  return NextResponse.json(proposal, { status: 201 });
}
