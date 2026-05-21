import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slots = await prisma.teacherAvailability.findMany({
    where: { teacherId: user.id, startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
  });
  return NextResponse.json(slots);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { startTime, endTime, note } = await req.json() as {
    startTime: string;
    endTime: string;
    note?: string;
  };

  if (!startTime || !endTime) {
    return NextResponse.json({ error: "startTime and endTime required" }, { status: 400 });
  }
  if (new Date(endTime) <= new Date(startTime)) {
    return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
  }

  const slot = await prisma.teacherAvailability.create({
    data: {
      teacherId: user.id,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      note: note ?? null,
    },
  });
  return NextResponse.json(slot, { status: 201 });
}
