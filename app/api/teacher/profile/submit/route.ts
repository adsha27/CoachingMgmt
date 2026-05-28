import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.teacherProfile.findUnique({
    where: { teacherId: user.id },
  });

  if (!profile) {
    return NextResponse.json({ error: "Complete your profile before submitting" }, { status: 400 });
  }

  if (profile.subjects.length === 0) {
    return NextResponse.json({ error: "Add at least one subject before submitting" }, { status: 400 });
  }

  if (profile.verifyStatus === "VERIFIED") {
    return NextResponse.json({ error: "Profile already verified" }, { status: 409 });
  }

  const updated = await prisma.teacherProfile.update({
    where: { teacherId: user.id },
    data: { verifyStatus: "PENDING" },
  });

  return NextResponse.json({ ok: true, verifyStatus: updated.verifyStatus });
}
