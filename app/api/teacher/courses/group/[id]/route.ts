import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const courseId = Number(id);

  const course = await prisma.groupCourse.findUnique({ where: { id: courseId } });
  if (!course || course.teacherId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json() as { action?: string; meetingLink?: string };

  // Teacher pastes their own meeting link (Meet/Zoom/whatever) for the class.
  // It's stored on every session of the course; students only see it once their
  // booking is ACTIVE (approved/paid).
  if (body.action === "set-meeting-link") {
    const raw = body.meetingLink?.trim() ?? "";
    if (raw) {
      let parsed: URL;
      try { parsed = new URL(raw); } catch {
        return NextResponse.json({ error: "Enter a valid link starting with https://" }, { status: 400 });
      }
      if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
        return NextResponse.json({ error: "Link must be an http(s) URL" }, { status: 400 });
      }
    }
    const { count } = await prisma.session.updateMany({
      where: { groupCourseId: courseId },
      data: { meetLink: raw || null },
    });
    return NextResponse.json({ ok: true, meetingLink: raw || null, sessionsUpdated: count });
  }

  if (body.action === "publish") {
    if (course.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT courses can be published" }, { status: 409 });
    }
    const updated = await prisma.groupCourse.update({
      where: { id: courseId },
      data: { status: "LISTED" },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "close") {
    if (!["LISTED", "FULL"].includes(course.status)) {
      return NextResponse.json({ error: "Only LISTED or FULL courses can be closed" }, { status: 409 });
    }
    const updated = await prisma.groupCourse.update({
      where: { id: courseId },
      data: { status: "CLOSED" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action. Use action: 'publish' or 'close'" }, { status: 400 });
}
