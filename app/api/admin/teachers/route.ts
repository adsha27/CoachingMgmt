import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      teacherProfile: {
        select: {
          verifyStatus: true,
          subjects: true,
          rating: true,
        },
      },
      teacherToken: { select: { token: true, deletedAt: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(teachers);
}
