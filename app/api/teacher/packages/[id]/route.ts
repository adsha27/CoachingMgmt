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

  const body = await req.json() as { action?: string };

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
