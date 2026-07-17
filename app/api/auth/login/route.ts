import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE, dashboardFor } from "@/lib/auth";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

// Email + password login for every role. (Admins may also use /admin-login,
// which is identical minus the role filter.)
export async function POST(req: NextRequest) {
  const body = await req.json() as { email?: string; password?: string };
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });

  // One generic error for missing account / no-password / wrong-password —
  // never leak which case it was.
  const fail = () => NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

  if (!user || !user.password) return fail();

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return NextResponse.json({ error: "Too many failed attempts. Try again in a few minutes." }, { status: 423 });
  }

  const match = await bcryptjs.compare(password, user.password);
  if (!match) {
    const attempts = user.loginAttempts + 1;
    await prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: attempts,
        lockedUntil: attempts >= MAX_ATTEMPTS ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null,
      },
    });
    return fail();
  }

  // Only reachable after a correct password, so this doesn't leak account
  // existence to an attacker — it's shown only to the credential holder.
  if (user.status === "PENDING") {
    return NextResponse.json({ error: "Your teacher account is awaiting admin approval. You'll be able to sign in once it's approved." }, { status: 403 });
  }
  if (user.status !== "ACTIVE") return fail();

  await prisma.user.update({ where: { id: user.id }, data: { loginAttempts: 0, lockedUntil: null } });

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
