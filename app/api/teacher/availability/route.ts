import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;
const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;
type Day = (typeof DAYS)[number];

export async function GET(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slots = await prisma.teacherAvailability.findMany({
    where: { teacherId: user.id, status: "AVAILABLE" },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { dayOfWeek, startTime, endTime, isRecurring, specificDate } = await req.json() as {
    dayOfWeek?: string;
    startTime?: string;
    endTime?: string;
    isRecurring?: boolean;
    specificDate?: string;
  };

  if (!dayOfWeek || !startTime || !endTime) {
    return NextResponse.json({ error: "dayOfWeek, startTime, and endTime required" }, { status: 400 });
  }
  if (!DAYS.includes(dayOfWeek as Day)) {
    return NextResponse.json({ error: "dayOfWeek must be MON|TUE|WED|THU|FRI|SAT|SUN" }, { status: 400 });
  }
  if (!TIME_RE.test(startTime) || !TIME_RE.test(endTime)) {
    return NextResponse.json({ error: "startTime and endTime must be HH:MM (24h)" }, { status: 400 });
  }
  if (endTime <= startTime) {
    return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 });
  }

  const slot = await prisma.teacherAvailability.create({
    data: {
      teacherId: user.id,
      dayOfWeek: dayOfWeek as Day,
      startTime,
      endTime,
      isRecurring: isRecurring ?? true,
      specificDate: specificDate ? new Date(specificDate) : null,
    },
  });
  return NextResponse.json(slot, { status: 201 });
}
