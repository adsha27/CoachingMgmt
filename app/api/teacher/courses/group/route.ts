import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

const DAY_MAP: Record<string, number> = {
  MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 0,
};

function generateSessionDates(
  startDate: Date,
  sessionHour: number,
  sessionMinute: number,
  weekDayNums: number[],
  total: number,
): Date[] {
  const dates: Date[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(sessionHour, sessionMinute, 0, 0);

  // Advance to first matching weekday on or after startDate
  for (let i = 0; i < 7; i++) {
    if (weekDayNums.includes(cursor.getDay())) break;
    cursor.setDate(cursor.getDate() + 1);
  }

  while (dates.length < total) {
    if (weekDayNums.includes(cursor.getDay())) {
      dates.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    title?: string;
    subject?: string;
    targetExam?: string;
    description?: string;
    totalSessions?: number;
    sessionDurationMinutes?: number;
    priceINR?: number;
    originalPriceINR?: number | null;
    maxStudents?: number;
    startDate?: string;
    sessionTime?: string;
    weekDays?: string[];
  };

  const { title, subject, totalSessions, sessionDurationMinutes, priceINR, startDate, sessionTime, weekDays } = body;

  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!subject?.trim()) return NextResponse.json({ error: "subject is required" }, { status: 400 });
  if (!totalSessions || totalSessions < 1) return NextResponse.json({ error: "totalSessions must be ≥ 1" }, { status: 400 });
  if (!sessionDurationMinutes || sessionDurationMinutes < 1) return NextResponse.json({ error: "sessionDurationMinutes required" }, { status: 400 });
  if (priceINR === undefined || priceINR < 0) return NextResponse.json({ error: "priceINR required" }, { status: 400 });
  if (!startDate) return NextResponse.json({ error: "startDate required" }, { status: 400 });
  if (!sessionTime || !/^\d{2}:\d{2}$/.test(sessionTime)) return NextResponse.json({ error: "sessionTime must be HH:MM" }, { status: 400 });
  if (!weekDays?.length) return NextResponse.json({ error: "weekDays must have at least one day" }, { status: 400 });

  const invalidDays = weekDays.filter((d) => !(d in DAY_MAP));
  if (invalidDays.length) return NextResponse.json({ error: `Invalid days: ${invalidDays.join(", ")}` }, { status: 400 });

  const [h, m] = sessionTime.split(":").map(Number);
  const weekDayNums = weekDays.map((d) => DAY_MAP[d]);
  const sessionDates = generateSessionDates(new Date(startDate), h, m, weekDayNums, totalSessions);

  const actualStartDate = sessionDates[0];

  const course = await prisma.$transaction(async (tx) => {
    const created = await tx.groupCourse.create({
      data: {
        teacherId: user.id,
        title: title.trim(),
        subject: subject.trim(),
        targetExam: body.targetExam?.trim() || null,
        description: body.description?.trim() || null,
        totalSessions,
        sessionDurationMinutes,
        priceINR,
        originalPriceINR: body.originalPriceINR && body.originalPriceINR > priceINR ? body.originalPriceINR : null,
        maxStudents: body.maxStudents ?? 30,
        startDate: actualStartDate,
        status: "DRAFT",
      },
    });

    // One INSERT for all sessions instead of N sequential creates — N creates
    // blew past the 5s interactive-transaction timeout for larger courses.
    // Meet links are generated at approval/confirmation time (see class-delivery
    // work), never here: calling the Calendar API per session inside a DB
    // transaction is what made this slow and fragile in the first place.
    const sessionRows = await tx.session.createManyAndReturn({
      data: sessionDates.map((scheduledAt, i) => ({
        groupCourseId: created.id,
        sessionNumber: i + 1,
        scheduledAt,
        durationMinutes: sessionDurationMinutes,
        status: "SCHEDULED" as const,
      })),
    });

    return { ...created, sessions: sessionRows };
  });

  return NextResponse.json(course, { status: 201 });
}
