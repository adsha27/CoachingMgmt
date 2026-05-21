import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyCode } from "@/lib/otp";
import { createSession, SESSION_COOKIE, dashboardFor } from "@/lib/auth";

const MAX_OTP_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const { email, code } = await req.json() as { email: string; code: string };
  if (!email || !code) {
    return NextResponse.json({ error: "email and code required" }, { status: 400 });
  }

  // Verify only the most recent code for this email.
  const otpRow = await prisma.otpCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRow) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  if (otpRow.usedAt) {
    return NextResponse.json({ error: "Code already used" }, { status: 400 });
  }
  if (otpRow.expiresAt < new Date()) {
    return NextResponse.json({ error: "Code expired" }, { status: 400 });
  }
  if (otpRow.failedAttempts >= MAX_OTP_ATTEMPTS) {
    return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
  }

  const match = await verifyCode(code, otpRow.codeHash);
  if (!match) {
    const newCount = otpRow.failedAttempts + 1;
    await prisma.otpCode.update({
      where: { id: otpRow.id },
      data: {
        failedAttempts: newCount,
        usedAt: newCount >= MAX_OTP_ATTEMPTS ? new Date() : undefined,
      },
    });
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  // Mark used
  await prisma.otpCode.update({ where: { id: otpRow.id }, data: { usedAt: new Date() } });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Account not active" }, { status: 403 });
  }

  const sessionId = await createSession(user.id);
  const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const res = NextResponse.json({ ok: true, redirect: dashboardFor(user.role) });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
  return res;
}
