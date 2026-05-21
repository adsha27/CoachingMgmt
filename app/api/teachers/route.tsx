import { NextRequest, NextResponse } from "next/server";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import {
  TeacherScheduleUrlEmail,
  teacherScheduleUrlText,
} from "@/lib/emails/teacher-schedule-url";

export async function GET() {
  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    include: { teacherToken: { select: { token: true, deletedAt: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(teachers);
}

export async function POST(req: NextRequest) {
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

  const teacher = await prisma.user.create({
    data: {
      name,
      phone,
      email,
      role: "TEACHER",
      teacherToken: { create: {} },
    },
    include: { teacherToken: { select: { token: true } } },
  });

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
