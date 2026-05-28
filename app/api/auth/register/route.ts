import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyRegToken } from "@/lib/regtoken";
import { createSession, SESSION_COOKIE, dashboardFor } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    registration_token?: string;
    name?: string;
    email?: string;
    role?: string;
  };

  const { registration_token, name, email, role } = body;

  if (!registration_token || !name?.trim() || !email?.includes("@") || !role) {
    return NextResponse.json({ error: "registration_token, name, email, and role required" }, { status: 400 });
  }

  const validRoles = ["TEACHER", "STUDENT"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "role must be TEACHER or STUDENT" }, { status: 400 });
  }

  const payload = verifyRegToken(registration_token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired registration token" }, { status: 401 });
  }

  const { phone } = payload;

  // Guard against race conditions — phone may have been registered between OTP verify and here
  const existing = await prisma.user.findFirst({ where: { OR: [{ phone }, { email }] } });
  if (existing) {
    return NextResponse.json({ error: "Phone or email already registered" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: { phone, name: name.trim(), email, role: role as "TEACHER" | "STUDENT" },
  });

  const sessionId = await createSession(user.id);
  const res = NextResponse.json({ ok: true, redirect: dashboardFor(user.role) }, { status: 201 });
  res.cookies.set(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    path: "/",
  });
  return res;
}
