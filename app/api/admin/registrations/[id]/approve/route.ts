import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import React from "react";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  RegistrationApprovedEmail,
  registrationApprovedText,
} from "@/lib/emails/registration-approved";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!session || session.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const userId = Number(id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { teacherProfile: true, teacherToken: true },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.status === "ACTIVE") {
    return NextResponse.json({ error: "Already approved" }, { status: 409 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  // Activate the user
  await prisma.user.update({ where: { id: userId }, data: { status: "ACTIVE" } });

  let scheduleUrl: string | undefined;

  if (user.role === "TEACHER") {
    // Approve TeacherProfile
    if (user.teacherProfile) {
      await prisma.teacherProfile.update({
        where: { teacherId: userId },
        data: { verifyStatus: "APPROVED" },
      });
    }
    // Create TeacherToken if missing
    let token = user.teacherToken?.token;
    if (!token) {
      const t = await prisma.teacherToken.create({ data: { teacherId: userId } });
      token = t.token;
    }
    scheduleUrl = `${baseUrl}/schedule/${token}`;
  }

  // Send welcome email (non-fatal)
  const loginUrl = `${baseUrl}/login`;
  try {
    const html = await render(
      React.createElement(RegistrationApprovedEmail, {
        name: user.name,
        role: user.role as "TEACHER" | "STUDENT",
        loginUrl,
        scheduleUrl,
      })
    );
    await sendEmail({
      to: user.email,
      subject: "Your account has been approved",
      html,
      text: registrationApprovedText({
        name: user.name,
        role: user.role as "TEACHER" | "STUDENT",
        loginUrl,
        scheduleUrl,
      }),
    });
  } catch (err) {
    console.error("Approval email failed:", err);
  }

  return NextResponse.json({ ok: true, scheduleUrl });
}
