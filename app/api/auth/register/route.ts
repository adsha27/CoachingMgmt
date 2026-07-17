import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession, SESSION_COOKIE, dashboardFor } from "@/lib/auth";
import { normalisePhone } from "@/lib/otp";
import { createApplication } from "@/lib/applications";

const MIN_PASSWORD = 8;

// Email + password registration. Doubles as the "apply to a class" entry point:
// pass applyCourseId / applyPackageId and a PENDING application is created for
// the new student in the same request.
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    role?: string;
    targetExam?: string;
    currentClass?: string;
    applyCourseId?: number;
    applyPackageId?: number;
  };

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const phone = normalisePhone(body.phone ?? "");
  const password = body.password ?? "";
  const role = body.role;

  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!email || !email.includes("@")) return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "A valid 10-digit Indian mobile number is required" }, { status: 400 });
  if (password.length < MIN_PASSWORD) return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters` }, { status: 400 });
  // ADMIN can never be self-assigned — only STUDENT/TEACHER self-register.
  if (role !== "STUDENT" && role !== "TEACHER") return NextResponse.json({ error: "role must be STUDENT or TEACHER" }, { status: 400 });

  const existing = await prisma.user.findFirst({ where: { OR: [{ phone }, { email }] } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email or phone already exists. Try signing in." }, { status: 409 });
  }

  const passwordHash = await bcryptjs.hash(password, 10);

  // Teachers must be approved by an admin before their login works — they're
  // created PENDING and get no session. Students are active immediately.
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      password: passwordHash,
      role,
      status: role === "TEACHER" ? "PENDING" : "ACTIVE",
      targetExam: role === "STUDENT" ? body.targetExam?.trim() || null : null,
      currentClass: role === "STUDENT" ? body.currentClass?.trim() || null : null,
    },
  });

  if (role === "TEACHER") {
    return NextResponse.json({ pending: true }, { status: 201 });
  }

  // Optional: apply to a class as part of signing up.
  if (body.applyCourseId || body.applyPackageId) {
    const target = body.applyCourseId
      ? { groupCourseId: body.applyCourseId }
      : { oneOnOnePackageId: body.applyPackageId! };
    await createApplication(user.id, target); // best-effort — account is created regardless
  }

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
