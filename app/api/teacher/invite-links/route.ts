import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { randomBytes } from "crypto";

function generateCode(): string {
  return randomBytes(9).toString("base64url").slice(0, 12);
}

export async function POST(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    groupCourseId?: number;
    oneOnOnePackageId?: number;
    expiresInDays?: number;
  };

  const { groupCourseId, oneOnOnePackageId, expiresInDays = 30 } = body;

  const targets = [groupCourseId, oneOnOnePackageId].filter(Boolean);
  if (targets.length !== 1) {
    return NextResponse.json(
      { error: "Provide exactly one of: groupCourseId, oneOnOnePackageId" },
      { status: 400 },
    );
  }

  // Ownership check
  if (groupCourseId) {
    const course = await prisma.groupCourse.findUnique({ where: { id: groupCourseId } });
    if (!course || course.teacherId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (oneOnOnePackageId) {
    const pkg = await prisma.oneOnOnePackage.findUnique({ where: { id: oneOnOnePackageId } });
    if (!pkg || pkg.teacherId !== user.id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + Math.max(1, Math.min(365, expiresInDays)));

  let code: string;
  let attempts = 0;
  do {
    code = generateCode();
    attempts++;
    if (attempts > 10) throw new Error("Could not generate unique invite code");
  } while (await prisma.inviteLink.findUnique({ where: { code } }));

  const invite = await prisma.inviteLink.create({
    data: {
      teacherId: user.id,
      groupCourseId: groupCourseId ?? null,
      oneOnOnePackageId: oneOnOnePackageId ?? null,
      code,
      expiresAt,
    },
  });

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  return NextResponse.json({ ...invite, url: `${baseUrl}/invite/${code}` }, { status: 201 });
}
