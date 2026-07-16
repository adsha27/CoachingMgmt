import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const packages = await prisma.oneOnOnePackage.findMany({
    where: { teacherId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(packages);
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
  };

  const { title, subject, totalSessions, sessionDurationMinutes, priceINR } = body;

  if (!title?.trim()) return NextResponse.json({ error: "title is required" }, { status: 400 });
  if (!subject?.trim()) return NextResponse.json({ error: "subject is required" }, { status: 400 });
  if (!totalSessions || totalSessions < 1) return NextResponse.json({ error: "totalSessions must be ≥ 1" }, { status: 400 });
  if (!sessionDurationMinutes || sessionDurationMinutes < 1) return NextResponse.json({ error: "sessionDurationMinutes required" }, { status: 400 });
  if (priceINR === undefined || priceINR < 0) return NextResponse.json({ error: "priceINR required" }, { status: 400 });

  const pkg = await prisma.oneOnOnePackage.create({
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
      status: "DRAFT",
    },
  });

  return NextResponse.json(pkg, { status: 201 });
}
