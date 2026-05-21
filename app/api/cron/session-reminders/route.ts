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
  const windowStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const sessions = await prisma.session.findMany({
    where: {
      status: "SCHEDULED",
      scheduledDate: { gte: windowStart, lte: windowEnd },
      reminderSentAt: null,
    },
    include: {
      teacher: { select: { name: true, email: true } },
      students: { include: { student: { select: { name: true, email: true } } } },
    },
  });

  const results: { sessionId: number; ok: boolean; error?: string }[] = [];

  for (const session of sessions) {
    const allEmails = [
      session.teacher.email,
      ...session.students.map((ss) => ss.student.email),
    ];

    try {
      for (let idx = 0; idx < allEmails.length; idx++) {
        const email = allEmails[idx];
        const recipientRole = idx === 0 ? "teacher" : "student";
        const html = await render(
          React.createElement(SessionReminderEmail, {
            teacherName: session.teacher.name,
            subject: session.subject,
            scheduledDate: session.scheduledDate,
            durationMinutes: session.durationMinutes,
            meetLink: session.meetLink ?? "",
            recipientRole,
          })
        );
        await sendEmail({
          to: email,
          subject: `Reminder: ${session.subject} tomorrow`,
          html,
          text: sessionReminderText({
            teacherName: session.teacher.name,
            subject: session.subject,
            scheduledDate: session.scheduledDate,
            durationMinutes: session.durationMinutes,
            meetLink: session.meetLink ?? "",
            recipientRole,
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
