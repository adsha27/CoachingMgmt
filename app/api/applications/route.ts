import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { createApplication } from "@/lib/applications";

// Apply to a class as an already-signed-in student.
export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "STUDENT") {
    return NextResponse.json({ error: "Sign in as a student to apply" }, { status: 401 });
  }

  const body = await req.json() as {
    courseId?: number;
    packageId?: number;
    targetExam?: string;
    currentClass?: string;
  };

  if (!body.courseId && !body.packageId) {
    return NextResponse.json({ error: "courseId or packageId required" }, { status: 400 });
  }

  // Backfill profile details if the student is filling them in now.
  if (body.targetExam?.trim() || body.currentClass?.trim()) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.targetExam?.trim() ? { targetExam: body.targetExam.trim() } : {}),
        ...(body.currentClass?.trim() ? { currentClass: body.currentClass.trim() } : {}),
      },
    });
  }

  const target = body.courseId ? { groupCourseId: body.courseId } : { oneOnOnePackageId: body.packageId! };
  const result = await createApplication(user.id, target);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true }, { status: 201 });
}
