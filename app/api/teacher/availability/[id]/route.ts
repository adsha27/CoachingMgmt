import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const slots = await prisma.teacherAvailability.findMany({
    where: { teacherId: Number(id), startTime: { gte: new Date() } },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(slots);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const slot = await prisma.teacherAvailability.findUnique({
    where: { id: Number(id) },
  });

  if (!slot) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (slot.teacherId !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.teacherAvailability.delete({ where: { id: Number(id) } });
  return NextResponse.json({ ok: true });
}
