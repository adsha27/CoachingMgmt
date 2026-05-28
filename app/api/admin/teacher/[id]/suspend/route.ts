import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const teacher = await prisma.user.findFirst({
    where: { id: Number(id), role: "TEACHER" },
  });
  if (!teacher) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const newStatus = teacher.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
  await prisma.user.update({
    where: { id: teacher.id },
    data: { status: newStatus },
  });

  return NextResponse.json({ ok: true, status: newStatus });
}
