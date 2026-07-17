import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

// Admin approves (PENDING -> ACTIVE) or rejects (PENDING -> SUSPENDED) a
// self-registered teacher account. Login is blocked until ACTIVE.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!admin || admin.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action } = await req.json() as { action?: "approve" | "reject" };
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "action must be approve or reject" }, { status: 400 });
  }

  const teacher = await prisma.user.findFirst({
    where: { id: Number((await params).id), role: "TEACHER", status: "PENDING" },
  });
  if (!teacher) {
    return NextResponse.json({ error: "Pending teacher not found" }, { status: 404 });
  }

  await prisma.user.update({
    where: { id: teacher.id },
    data: { status: action === "approve" ? "ACTIVE" : "SUSPENDED" },
  });
  return NextResponse.json({ ok: true });
}
