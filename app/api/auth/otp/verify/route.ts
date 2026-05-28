import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalisePhone, verifyCode } from "@/lib/otp";
import { createSession, SESSION_COOKIE, dashboardFor } from "@/lib/auth";
import { createRegToken } from "@/lib/regtoken";

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
        usedAt: newCount >= MAX_OTP_ATTEMPTS ? new Date() : undefined,
      },
    });
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }

  await prisma.otpCode.update({ where: { id: otpRow.id }, data: { usedAt: new Date() } });

  const user = await prisma.user.findUnique({ where: { phone } });

  // New phone — issue a short-lived registration token, no session yet
  if (!user) {
    return NextResponse.json({ ok: true, needs_registration: true, registration_token: createRegToken(phone) });
  }

  if (user.status !== "ACTIVE") {
    return NextResponse.json({ error: "Account suspended" }, { status: 403 });
  }

  const sessionId = await createSession(user.id);
  const res = NextResponse.json({ ok: true, redirect: dashboardFor(user.role) });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    path: "/",
  });
  return res;
}
