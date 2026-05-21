import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import {
  TeacherScheduleUrlEmail,
  teacherScheduleUrlText,
} from "@/lib/emails/teacher-schedule-url";

async function requireAdmin(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function GET(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: { teacherToken: { select: { token: true, deletedAt: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(teachers);
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { name, phone, email } = body as {
    name: string;
    phone: string;
    email: string;
  };

  if (!name || !phone || !email) {
    return NextResponse.json(
      { error: "name, phone, and email are required" },
      { status: 400 }
    );
  }

  let teacher;
  try {
    teacher = await prisma.user.create({
      data: {
        name,
        phone,
        email,
        role: "TEACHER",
        teacherToken: { create: {} },
      },
      include: { teacherToken: { select: { token: true } } },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "field";
      return NextResponse.json({ error: `A user with this ${target} already exists` }, { status: 409 });
    }
    throw err;
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";
  const scheduleUrl = `${baseUrl}/schedule/${teacher.teacherToken!.token}`;

  let emailError: string | null = null;
  try {
    const html = await render(
      <TeacherScheduleUrlEmail
        teacherName={teacher.name}
        scheduleUrl={scheduleUrl}
      />
    );
    await sendEmail({
      to: teacher.email,
      subject: "Your teaching schedule link",
      html,
      text: teacherScheduleUrlText({ teacherName: teacher.name, scheduleUrl }),
    });
  } catch (err) {
    emailError = err instanceof Error ? err.message : "Email failed";
  }

  return NextResponse.json({ teacher, scheduleUrl, emailError }, { status: 201 });
}
