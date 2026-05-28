import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { action, adminNote } = await req.json() as {
    action?: "APPROVED" | "REJECTED";
    adminNote?: string;
  };

  if (!action || !["APPROVED", "REJECTED"].includes(action)) {
    return NextResponse.json({ error: "action must be APPROVED or REJECTED" }, { status: 400 });
  }

  const request = await prisma.cancellationRequest.findUnique({
    where: { id: Number(id) },
    include: {
      session: true,
      groupCourse: true,
      oneOnOnePackage: true,
    },
  });

  if (!request) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (request.status !== "PENDING") {
    return NextResponse.json({ error: "Already processed" }, { status: 409 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.cancellationRequest.update({
      where: { id: request.id },
      data: { status: action, adminNote: adminNote ?? null },
    });

    if (action === "APPROVED") {
      // Cancel the session or close the course
      if (request.sessionId) {
        await tx.session.update({
          where: { id: request.sessionId },
          data: { status: "CANCELLED", cancelReason: request.reason },
        });
      } else if (request.groupCourseId) {
        await tx.groupCourse.update({
          where: { id: request.groupCourseId },
          data: { status: "CLOSED" },
        });
      } else if (request.oneOnOnePackageId) {
        await tx.oneOnOnePackage.update({
          where: { id: request.oneOnOnePackageId },
          data: { status: "CLOSED" },
        });
      }
    }
  });

  return NextResponse.json({ ok: true, action });
}
