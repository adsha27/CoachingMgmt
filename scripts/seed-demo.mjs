/**
 * Demo seed — creates a self-contained demo dataset for showing the product.
 *
 * Accounts (all use fixed OTP 123456 in local dev):
 *   admin@example.test    — Admin
 *   teacher@example.test  — Teacher "Priya Sharma" (VERIFIED)
 *   student1@example.test — Student "Arjun Mehta" (has group + 1-on-1 bookings)
 *   student2@example.test — Student "Kavya Nair"  (has group booking)
 *
 * Data created:
 *   1 teacher with VERIFIED profile, 1 group course (LISTED), 1 1-on-1 package (LISTED)
 *   1 upcoming group session (tomorrow)
 *   1 past completed session (last week, with feedback)
 *   1 pending slot proposal (student1 → teacher for 1-on-1)
 *   1 weekly availability slot (Monday 10:00-12:00, recurring)
 *
 * Safe to run multiple times (upserts by email/phone).
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

  console.log("Users ready:", [admin, teacher, student1, student2].map((u) => u.email).join(", "));

  // ── Teacher profile (VERIFIED) ─────────────────────────────────────────────

  await prisma.teacherProfile.upsert({
    where: { teacherId: teacher.id },
    update: {},
    create: {
      teacherId: teacher.id,
      bio: "IIT Delhi alumna, 7 years JEE coaching. Strong focus on conceptual clarity and problem-solving speed.",
      qualifications: "B.Tech (IIT Delhi, 2015). JEE Advanced AIR 218.",
      subjects: ["Physics", "Chemistry"],
      targetExams: ["JEE Main", "JEE Advanced"],
      teachingExperienceYears: 7,
      verifyStatus: "VERIFIED",
      rating: 4.8,
      demoVideoLink: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      socialMediaLinks: { youtube: "https://youtube.com/@priyasharmaJEE" },
    },
  });

  // ── Group course ───────────────────────────────────────────────────────────

  let groupCourse = await prisma.groupCourse.findFirst({
    where: { teacherId: teacher.id, title: "JEE Physics Crash Course" },
  });

  if (!groupCourse) {
    groupCourse = await prisma.groupCourse.create({
      data: {
        teacherId: teacher.id,
        title: "JEE Physics Crash Course",
        description: "Covers Mechanics, Electrostatics, Waves in 20 intensive sessions.",
        subject: "Physics",
        targetExam: "JEE Advanced",
        status: "LISTED",
        totalSessions: 20,
        sessionDurationMinutes: 90,
        priceINR: 4999,
        maxStudents: 30,
        enrolledCount: 2,
        startDate: daysFromNow(1),
      },
    });
    console.log("Group course created:", groupCourse.id);
  } else {
    console.log("Group course exists:", groupCourse.id);
  }

  // ── 1-on-1 package ────────────────────────────────────────────────────────

  let pkg = await prisma.oneOnOnePackage.findFirst({
    where: { teacherId: teacher.id, title: "1-on-1 Physics Doubt Clearing" },
  });

  if (!pkg) {
    pkg = await prisma.oneOnOnePackage.create({
      data: {
        teacherId: teacher.id,
        title: "1-on-1 Physics Doubt Clearing",
        description: "Personalised doubt-clearing sessions. Flexible scheduling.",
        subject: "Physics",
        targetExam: "JEE Main",
        status: "LISTED",
        totalSessions: 8,
        sessionDurationMinutes: 60,
        priceINR: 6400,
      },
    });
    console.log("1-on-1 package created:", pkg.id);
  } else {
    console.log("1-on-1 package exists:", pkg.id);
  }

  // ── Booking: student1 → group course ──────────────────────────────────────

  let booking1 = await prisma.booking.findFirst({
    where: { studentId: student1.id, groupCourseId: groupCourse.id },
  });

  if (!booking1) {
    booking1 = await prisma.booking.create({
      data: {
        studentId: student1.id,
        groupCourseId: groupCourse.id,
        courseType: "GROUP",
        totalSessions: groupCourse.totalSessions,
        sessionsRemaining: groupCourse.totalSessions - 1,
        sessionsCompleted: 1,
        sessionsScheduled: 1,
      },
    });
    console.log("Booking (student1 group) created:", booking1.id);
  } else {
    console.log("Booking (student1 group) exists:", booking1.id);
  }

  // ── Booking: student2 → group course ──────────────────────────────────────

  let booking2 = await prisma.booking.findFirst({
    where: { studentId: student2.id, groupCourseId: groupCourse.id },
  });

  if (!booking2) {
    booking2 = await prisma.booking.create({
      data: {
        studentId: student2.id,
        groupCourseId: groupCourse.id,
        courseType: "GROUP",
        totalSessions: groupCourse.totalSessions,
        sessionsRemaining: groupCourse.totalSessions,
        sessionsCompleted: 0,
        sessionsScheduled: 0,
      },
    });
    console.log("Booking (student2 group) created:", booking2.id);
  } else {
    console.log("Booking (student2 group) exists:", booking2.id);
  }

  // ── Booking: student1 → 1-on-1 package ───────────────────────────────────

  let booking3 = await prisma.booking.findFirst({
    where: { studentId: student1.id, oneOnOnePackageId: pkg.id },
  });

  if (!booking3) {
    booking3 = await prisma.booking.create({
      data: {
        studentId: student1.id,
        oneOnOnePackageId: pkg.id,
        courseType: "ONE_ON_ONE",
        totalSessions: pkg.totalSessions,
        sessionsRemaining: pkg.totalSessions - 1,
        sessionsCompleted: 1,
        sessionsScheduled: 0,
      },
    });
    console.log("Booking (student1 1-on-1) created:", booking3.id);
  } else {
    console.log("Booking (student1 1-on-1) exists:", booking3.id);
  }

  // ── Session: upcoming group session (tomorrow) ────────────────────────────

  let upcoming = await prisma.session.findFirst({
    where: { bookingId: booking1.id, status: "SCHEDULED" },
  });

  if (!upcoming) {
    upcoming = await prisma.session.create({
      data: {
        bookingId: booking1.id,
        groupCourseId: groupCourse.id,
        sessionNumber: 2,
        scheduledAt: daysFromNow(1),
        durationMinutes: 90,
        meetLink: "https://meet.google.com/demo-link-abc",
        calendarEventId: "demo-calendar-event-upcoming",
      },
    });
    console.log("Upcoming session created:", upcoming.id);
  } else {
    console.log("Upcoming session exists:", upcoming.id);
  }

  // ── Session: past completed session (last week, with feedback) ────────────

  let past = await prisma.session.findFirst({
    where: { bookingId: booking1.id, status: "COMPLETED" },
  });

  if (!past) {
    past = await prisma.session.create({
      data: {
        bookingId: booking1.id,
        groupCourseId: groupCourse.id,
        sessionNumber: 1,
        scheduledAt: daysFromNow(-7),
        durationMinutes: 90,
        meetLink: "https://meet.google.com/demo-link-past",
        calendarEventId: "demo-calendar-event-past",
        status: "COMPLETED",
      },
    });
    console.log("Past session created:", past.id);

    // Feedback for the completed session
    const existingFeedback = await prisma.sessionFeedback.findFirst({
      where: { sessionId: past.id, studentId: student1.id },
    });
    if (!existingFeedback) {
      await prisma.sessionFeedback.create({
        data: {
          sessionId: past.id,
          studentId: student1.id,
          rating: 5,
          comment: "Excellent session — Priya explained wave optics beautifully.",
        },
      });
      console.log("Feedback created for past session");
    }
  } else {
    console.log("Past session exists:", past.id);
  }

  // ── Slot proposal: student1 → teacher for 1-on-1 ─────────────────────────

  const existingProposal = await prisma.slotProposal.findFirst({
    where: { bookingId: booking3.id, status: "PENDING" },
  });

  if (!existingProposal) {
    await prisma.slotProposal.create({
      data: {
        bookingId: booking3.id,
        proposedDate: daysFromNow(3),
        proposedStartTime: "14:00",
        status: "PENDING",
      },
    });
    console.log("Slot proposal created");
  } else {
    console.log("Slot proposal exists");
  }

  // ── Availability slot (Monday 10:00–12:00, recurring) ─────────────────────

  const existingAvail = await prisma.teacherAvailability.findFirst({
    where: { teacherId: teacher.id },
  });

  if (!existingAvail) {
    await prisma.teacherAvailability.create({
      data: {
        teacherId: teacher.id,
        dayOfWeek: "MON",
        startTime: "10:00",
        endTime: "12:00",
        isRecurring: true,
        status: "AVAILABLE",
      },
    });
    console.log("Availability slot created");
  } else {
    console.log("Availability slot exists");
  }

  console.log(`
Demo dataset ready. Access at http://localhost:3000
Login at /login — use dev bypass or phone OTP (OTP 123456 for any @example.test phone).

  admin@example.test    (phone 0000000000) → Admin dashboard
  teacher@example.test  (phone 9900000001) → Teacher portal (Priya Sharma, VERIFIED)
  student1@example.test (phone 8800000001) → Student portal (Arjun Mehta — has bookings + sessions)
  student2@example.test (phone 8800000002) → Student portal (Kavya Nair — group booking)

Quick links:
  /browse               → Public marketplace
  /teacher/${teacher.id}   → Priya Sharma public profile
  /admin/verification   → Teacher verification queue
`);
} finally {
  await prisma.$disconnect();
}
