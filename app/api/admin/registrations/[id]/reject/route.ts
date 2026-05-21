import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacherProfile: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // For teachers, mark the profile rejected
  if (user.role === "TEACHER" && user.teacherProfile) {
    await prisma.teacherProfile.update({
      where: { teacherId: userId },
      data: { verifyStatus: "REJECTED" },
    });
  }

  // Delete the user entirely — they can re-register
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ ok: true });
}
