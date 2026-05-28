import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const requests = await prisma.topicRequest.findMany({
    where: { studentId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as { subject?: string; topicDescription?: string };
  const { subject, topicDescription } = body;

  if (!subject?.trim()) return NextResponse.json({ error: "subject is required" }, { status: 400 });
  if (!topicDescription?.trim()) return NextResponse.json({ error: "topicDescription is required" }, { status: 400 });

  const request = await prisma.topicRequest.create({
    data: {
      studentId: user.id,
      subject: subject.trim(),
      topicDescription: topicDescription.trim(),
      status: "OPEN",
    },
  });

  return NextResponse.json(request, { status: 201 });
}
