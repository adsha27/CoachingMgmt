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
  const pkgId = Number(id);

  const pkg = await prisma.oneOnOnePackage.findUnique({ where: { id: pkgId } });
  if (!pkg || pkg.teacherId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json() as { action?: string; meetingLink?: string };

  // Teacher's own meeting link for this package. Stored on the package because
  // 1-on-1 sessions don't exist until a slot is agreed; the link is copied onto
  // each session as it's created, and sent to the student on approval.
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
    const updated = await prisma.oneOnOnePackage.update({
      where: { id: pkgId },
      data: { meetingLink: raw || null },
    });
    // Keep any already-scheduled sessions for this package in sync.
    await prisma.session.updateMany({
      where: { booking: { oneOnOnePackageId: pkgId } },
      data: { meetLink: raw || null },
    });
    return NextResponse.json({ ok: true, meetingLink: updated.meetingLink });
  }

  if (body.action === "publish") {
    if (pkg.status !== "DRAFT") {
      return NextResponse.json({ error: "Only DRAFT packages can be published" }, { status: 409 });
    }
    const updated = await prisma.oneOnOnePackage.update({
      where: { id: pkgId },
      data: { status: "LISTED" },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "close") {
    if (pkg.status === "CLOSED") {
      return NextResponse.json({ error: "Already closed" }, { status: 409 });
    }
    const updated = await prisma.oneOnOnePackage.update({
      where: { id: pkgId },
      data: { status: "CLOSED" },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Unknown action. Use action: 'publish' or 'close'" }, { status: 400 });
}
