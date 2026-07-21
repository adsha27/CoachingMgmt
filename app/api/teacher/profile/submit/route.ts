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

  // Approval is the single vetting decision (see approve route). A teacher whose
  // account is already ACTIVE (admin-approved) completing their initial profile
  // is auto-verified — no separate review step. But if the admin explicitly sent
  // them back (REJECTED / MORE_INFO_REQUESTED), resubmitting returns to the queue
  // as PENDING; a teacher must not self-clear that state.
  const account = await prisma.user.findUnique({
    where: { id: user.id },
    select: { status: true },
  });
  const autoVerify = account?.status === "ACTIVE" && profile.verifyStatus === "PENDING";

  const updated = await prisma.teacherProfile.update({
    where: { teacherId: user.id },
    data: { verifyStatus: autoVerify ? "VERIFIED" : "PENDING" },
  });

  return NextResponse.json({ ok: true, verifyStatus: updated.verifyStatus });
}
