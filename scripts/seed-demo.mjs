/**
 * Demo seed — creates a self-contained demo dataset for showing the product.
 *
 * Accounts (all use fixed OTP 123456 in local dev via DEV_OTP env):
 *   admin@example.test    — Admin
 *   teacher@example.test  — Teacher "Priya Sharma"
 *   student1@example.test — Student "Arjun Mehta"
 *   student2@example.test — Student "Kavya Nair"
 *
 * Data:
 *   1 upcoming session (tomorrow, both students)
 *   1 past session (last week, completed)
 *   1 availability slot (day after tomorrow)
 *
 * Safe to run multiple times (upserts existing records).
 */

import { PrismaClient } from "@prisma/client";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env" });
loadEnv({ path: ".env.local", override: false });

const prisma = new PrismaClient();

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(10, 0, 0, 0);
  return d;
}

try {
  // ── Users ──────────────────────────────────────────────────────────────────

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.test" },
    update: { name: "Admin", role: "ADMIN", status: "ACTIVE" },
    create: { name: "Admin", email: "admin@example.test", phone: "0000000000", role: "ADMIN" },
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@example.test" },
    update: { name: "Priya Sharma", role: "TEACHER", status: "ACTIVE" },
    create: { name: "Priya Sharma", email: "teacher@example.test", phone: "9900000001", role: "TEACHER" },
  });

  // Ensure teacher has a schedule token
  await prisma.teacherToken.upsert({
    where: { teacherId: teacher.id },
    update: {},
    create: { teacherId: teacher.id },
  });

  const student1 = await prisma.user.upsert({
    where: { email: "student1@example.test" },
    update: { name: "Arjun Mehta", role: "STUDENT", status: "ACTIVE" },
    create: { name: "Arjun Mehta", email: "student1@example.test", phone: "8800000001", role: "STUDENT" },
  });

  const student2 = await prisma.user.upsert({
    where: { email: "student2@example.test" },
    update: { name: "Kavya Nair", role: "STUDENT", status: "ACTIVE" },
    create: { name: "Kavya Nair", email: "student2@example.test", phone: "8800000002", role: "STUDENT" },
  });

  console.log("Users ready:", [admin, teacher, student1, student2].map(u => u.email).join(", "));

  // ── Upcoming session ───────────────────────────────────────────────────────

  const existing = await prisma.session.findFirst({
    where: { teacherId: teacher.id, subject: "JEE Physics — Mechanics", status: "SCHEDULED" },
  });

  if (!existing) {
    const upcoming = await prisma.session.create({
      data: {
        teacherId: teacher.id,
        subject: "JEE Physics — Mechanics",
        scheduledDate: daysFromNow(1),
        durationMinutes: 90,
        meetLink: "https://meet.google.com/demo-link-abc",
        calendarEventId: "demo-calendar-event-upcoming",
        students: {
          create: [{ studentId: student1.id }, { studentId: student2.id }],
        },
      },
    });
    console.log("Upcoming session created:", upcoming.id);
  } else {
    console.log("Upcoming session already exists:", existing.id);
  }

  // ── Past session (completed) ───────────────────────────────────────────────

  const existingPast = await prisma.session.findFirst({
    where: { teacherId: teacher.id, subject: "JEE Chemistry — Organic", status: "COMPLETED" },
  });

  if (!existingPast) {
    const past = await prisma.session.create({
      data: {
        teacherId: teacher.id,
        subject: "JEE Chemistry — Organic",
        scheduledDate: daysFromNow(-7),
        durationMinutes: 60,
        meetLink: "https://meet.google.com/demo-link-xyz",
        calendarEventId: "demo-calendar-event-past",
        status: "COMPLETED",
        students: {
          create: [{ studentId: student1.id }],
        },
      },
    });
    console.log("Past session created:", past.id);
  } else {
    console.log("Past session already exists:", existingPast.id);
  }

  // ── Availability slot ──────────────────────────────────────────────────────

  const existingSlot = await prisma.teacherAvailability.findFirst({
    where: { teacherId: teacher.id },
  });

  if (!existingSlot) {
    const slotStart = daysFromNow(2);
    const slotEnd = new Date(slotStart.getTime() + 3 * 60 * 60 * 1000); // +3h
    await prisma.teacherAvailability.create({
      data: {
        teacherId: teacher.id,
        startTime: slotStart,
        endTime: slotEnd,
        note: "Available for extra sessions this week",
      },
    });
    console.log("Availability slot created");
  } else {
    console.log("Availability slot already exists");
  }

  console.log(`
Demo dataset ready. Login at /login with:
  admin@example.test    → Admin dashboard
  teacher@example.test  → Teacher portal
  student1@example.test → Student portal (Arjun)
  student2@example.test → Student portal (Kavya)

OTP: use DEV_OTP=123456 in .env.local (already set if you ran seed-admin).
`);
} finally {
  await prisma.$disconnect();
}
