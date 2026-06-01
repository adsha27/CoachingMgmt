import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { render } from "@react-email/render";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";
import { SessionReminderEmail, sessionReminderText } from "@/lib/emails/session-reminder";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowStart = new Date(now.getTime() + 55 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 75 * 60 * 1000);

  const sessions = await prisma.session.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
    },
    include: {
      booking: {
        include: {
          student: { select: { name: true, email: true } },
          oneOnOnePackage: {
            include: { teacher: { select: { name: true, email: true } } },
          },
        },
      },
      groupCourse: {
        include: {
          teacher: { select: { name: true, email: true } },
          bookings: {
            where: { status: "ACTIVE" },
            include: { student: { select: { name: true, email: true } } },
          },
        },
      },
    },
  });

  const results: { sessionId: number; ok: boolean; error?: string }[] = [];

  for (const session of sessions) {
    // Resolve teacher and participants depending on session type
    const isGroup = session.groupCourseId != null;
    const teacher = isGroup
      ? session.groupCourse!.teacher
      : session.booking?.oneOnOnePackage?.teacher;
    const students = isGroup
      ? session.groupCourse!.bookings.map((b) => b.student)
      : session.booking ? [session.booking.student] : [];
    const title = isGroup
      ? session.groupCourse!.title
      : (session.booking?.oneOnOnePackage?.title ?? "Session");

    if (!teacher) {
      results.push({ sessionId: session.id, ok: false, error: "teacher not found" });
      continue;
    }

    const recipients = [
      { email: teacher.email, role: "teacher" as const },
      ...students.filter((s) => s.email).map((s) => ({ email: s.email!, role: "student" as const })),
    ];

    try {
      for (const { email, role } of recipients) {
        const html = await render(
          React.createElement(SessionReminderEmail, {
            teacherName: teacher.name,
            subject: title,
            scheduledDate: session.scheduledAt,
            durationMinutes: session.durationMinutes,
            meetLink: session.meetLink ?? "",
            recipientRole: role,
          })
        );
        await sendEmail({
          to: email,
          subject: `Reminder: ${title} in 1 hour`,
          html,
          text: sessionReminderText({
            teacherName: teacher.name,
            subject: title,
            scheduledDate: session.scheduledAt,
            durationMinutes: session.durationMinutes,
            meetLink: session.meetLink ?? "",
            recipientRole: role,
          }),
        });
      }

      await prisma.session.update({
        where: { id: session.id },
        data: { reminderSentAt: now },
      });

      results.push({ sessionId: session.id, ok: true });
    } catch (err) {
      console.error(`Reminder failed for session ${session.id}:`, err);
      results.push({
        sessionId: session.id,
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  const sent = results.filter((r) => r.ok).length;
  const errors = results.filter((r) => !r.ok);
  return NextResponse.json({ sent, errors });
}
