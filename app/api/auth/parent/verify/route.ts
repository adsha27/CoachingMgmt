import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalisePhone, verifyCode } from "@/lib/otp";
import { createParentSession, SESSION_COOKIE } from "@/lib/auth";

const MAX_OTP_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const body = await req.json() as { phone?: string; code?: string };
  const phone = normalisePhone(body.phone ?? "");
  const code = body.code;

  if (!phone || !code) {
    return NextResponse.json({ error: "phone and code required" }, { status: 400 });
  }

  const otpRow = await prisma.otpCode.findFirst({
    where: { phone },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRow) return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  if (otpRow.usedAt) return NextResponse.json({ error: "Code already used" }, { status: 400 });
  if (otpRow.expiresAt < new Date()) return NextResponse.json({ error: "Code expired" }, { status: 400 });
  if (otpRow.failedAttempts >= MAX_OTP_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 423 });
  }

  const match = await verifyCode(code, otpRow.codeHash);
  if (!match) {
    const newCount = otpRow.failedAttempts + 1;
    await prisma.otpCode.update({
      where: { id: otpRow.id },
      data: {
        failedAttempts: newCount,
        ...(newCount >= MAX_OTP_ATTEMPTS ? { usedAt: new Date() } : {}),
      },
    });
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.otpCode.update({ where: { id: otpRow.id }, data: { usedAt: new Date() } });

  // Find the ParentAccess record for this phone
  const parentAccess = await prisma.parentAccess.findFirst({
    where: { parentPhone: phone, verified: false },
    orderBy: { createdAt: "desc" },
    include: { student: { select: { id: true } } },
  });

  if (!parentAccess) {
    return NextResponse.json({ error: "No pending parent access found for this phone" }, { status: 404 });
  }

  // Mark as verified
  await prisma.parentAccess.update({
    where: { id: parentAccess.id },
    data: { verified: true, lastAccessedAt: new Date() },
  });

  // Find or create a "parent" user (parents don't have full accounts — we use the student's userId with parentStudentId scope)
  // We need a User record for the session. Use the student's own user but create a parent-scoped session.
  // The session has parentStudentId set to the student's userId.
  // The session userId can be a placeholder — we'll store it as the student's userId for simplicity,
  // but the parentStudentId flag marks it as read-only parent access.
  const sessionId = await createParentSession(parentAccess.student.id, parentAccess.student.id);

  const res = NextResponse.json({ ok: true, redirect: "/parent/dashboard" });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60,
    path: "/",
  });
  return res;
}
