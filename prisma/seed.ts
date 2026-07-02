import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

function daysFromNow(n: number, hour = 18, minute = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function daysAgo(n: number, hour = 18, minute = 30): Date {
  return daysFromNow(-n, hour, minute);
}

async function main() {
  console.log("Seeding demo data…");

  // ── Wipe previous demo data ───────────────────────────────────────────────
  await db.sessionFeedback.deleteMany();
  await db.slotProposal.deleteMany();
  await db.session.deleteMany();
  await db.booking.deleteMany();
  await db.inviteLink.deleteMany();
  await db.cancellationRequest.deleteMany();
  await db.topicRequest.deleteMany();
  await db.parentAccess.deleteMany();
  await db.teacherAvailability.deleteMany();
  await db.groupCourse.deleteMany();
  await db.oneOnOnePackage.deleteMany();
  await db.teacherProfile.deleteMany();
  await db.teacherToken.deleteMany();
  await db.otpCode.deleteMany();
  await db.userSession.deleteMany();
  await db.user.deleteMany();

  // ── Users ─────────────────────────────────────────────────────────────────
  const admin = await db.user.create({
    data: {
      name: "Platform Admin",
      phone: "9000000000",
      email: "demo-admin@educonnect.in",
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const teacher1 = await db.user.create({
    data: {
      name: "Ravi Kumar",
      phone: "9000000001",
      email: "ravi.kumar@educonnect.in",
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  const teacher2 = await db.user.create({
    data: {
      name: "Priya Sharma",
      phone: "9000000002",
      email: "priya.sharma@educonnect.in",
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  const student = await db.user.create({
    data: {
      name: "Arjun Mehta",
      phone: "9000000003",
      email: "arjun.mehta@educonnect.in",
      role: "STUDENT",
      status: "ACTIVE",
    },
  });

  console.log("  Users created:", admin.id, teacher1.id, teacher2.id, student.id);

  // ── Teacher profiles ───────────────────────────────────────────────────────
  await db.teacherProfile.create({
    data: {
      teacherId: teacher1.id,
      bio: "IIT Bombay graduate (B.Tech Physics, 2018) with 6 years of JEE coaching. I have helped 200+ students crack JEE Main and Advanced. My approach: strong fundamentals, rapid problem-solving, and regular mock tests. Join any of my group batches or book a 1-on-1 session for targeted doubt clearing.",
      subjects: ["Physics"],
      targetExams: ["JEE Main", "JEE Advanced"],
      verifyStatus: "VERIFIED",
      rating: 4.8,
      teachingExperienceYears: 6,
      qualifications: "B.Tech, IIT Bombay (2018)\nJEE Advanced AIR 412 (2014)\n6 years coaching experience",
    },
  });

  await db.teacherProfile.create({
    data: {
      teacherId: teacher2.id,
      bio: "MBBS from AIIMS Delhi (2019). Cleared NEET with AIR 38. I teach Chemistry and Biology with a focus on concept clarity and quick revision techniques. My students consistently score 350+ in Chemistry+Biology. Available for group batches and private sessions.",
      subjects: ["Chemistry", "Biology"],
      targetExams: ["NEET"],
      verifyStatus: "VERIFIED",
      rating: 4.6,
      teachingExperienceYears: 4,
      qualifications: "MBBS, AIIMS Delhi (2019)\nNEET AIR 38 (2015)\n4 years coaching experience",
    },
  });

  // ── Teacher availability ───────────────────────────────────────────────────
  for (const day of ["MON", "TUE", "WED", "THU", "FRI"] as const) {
    await db.teacherAvailability.create({
      data: { teacherId: teacher1.id, dayOfWeek: day, startTime: "18:00", endTime: "21:00", isRecurring: true },
    });
  }
  for (const day of ["MON", "TUE", "WED", "THU", "FRI", "SAT"] as const) {
    await db.teacherAvailability.create({
      data: { teacherId: teacher2.id, dayOfWeek: day, startTime: "17:00", endTime: "20:00", isRecurring: true },
    });
  }

  // ── Group courses ──────────────────────────────────────────────────────────
  const course1 = await db.groupCourse.create({
    data: {
      teacherId: teacher1.id,
      title: "JEE Physics — Mechanics & Waves",
      subject: "Physics",
      targetExam: "JEE Main",
      description: "Complete mechanics and waves for JEE Main. Covers Newton's laws, work-energy, rotational motion, SHM, waves and sound. 30 sessions, 3 per week.",
      priceINR: 8999,
      totalSessions: 30,
      sessionDurationMinutes: 90,
      maxStudents: 25,
      enrolledCount: 12,
      startDate: daysFromNow(7),
      status: "LISTED",
    },
  });

  const course2 = await db.groupCourse.create({
    data: {
      teacherId: teacher2.id,
      title: "NEET Chemistry — Full Syllabus Prep",
      subject: "Chemistry",
      targetExam: "NEET",
      description: "Cover entire NEET Chemistry in 40 structured sessions. Inorganic, Organic and Physical chemistry. Previous year questions after every topic.",
      priceINR: 10999,
      totalSessions: 40,
      sessionDurationMinutes: 75,
      maxStudents: 20,
      enrolledCount: 8,
      startDate: daysFromNow(11),
      status: "LISTED",
    },
  });

  const course3 = await db.groupCourse.create({
    data: {
      teacherId: teacher1.id,
      title: "Electrostatics & Magnetism Crash",
      subject: "Physics",
      targetExam: "JEE Advanced",
      description: "15-session intensive for JEE Advanced electrostatics and magnetism. Heavy focus on multi-concept problems.",
      priceINR: 5999,
      totalSessions: 15,
      sessionDurationMinutes: 90,
      maxStudents: 15,
      enrolledCount: 5,
      startDate: daysFromNow(18),
      status: "LISTED",
    },
  });

  console.log("  Courses created:", course1.id, course2.id, course3.id);

  // ── 1-on-1 packages ────────────────────────────────────────────────────────
  const pkg1 = await db.oneOnOnePackage.create({
    data: {
      teacherId: teacher1.id,
      title: "JEE Physics 1-on-1 Pack",
      subject: "Physics",
      targetExam: "JEE Advanced",
      description: "10 private sessions. Each session tailored to your weak areas. Past JEE papers + custom problem sets.",
      priceINR: 14999,
      totalSessions: 10,
      sessionDurationMinutes: 60,
      status: "LISTED",
    },
  });

  const pkg2 = await db.oneOnOnePackage.create({
    data: {
      teacherId: teacher2.id,
      title: "NEET Doubt Clearing — 1-on-1",
      subject: "Chemistry",
      targetExam: "NEET",
      description: "8 private doubt-clearing sessions. Bring your questions from any NEET Chemistry topic.",
      priceINR: 9999,
      totalSessions: 8,
      sessionDurationMinutes: 60,
      status: "LISTED",
    },
  });

  console.log("  Packages created:", pkg1.id, pkg2.id);

  // ── Student bookings ───────────────────────────────────────────────────────
  // booking1: student enrolled in course1 (group)
  const booking1 = await db.booking.create({
    data: {
      studentId: student.id,
      groupCourseId: course1.id,
      courseType: "GROUP",
      totalSessions: 30,
      sessionsCompleted: 3,
      sessionsRemaining: 27,
      sessionsScheduled: 7,
      status: "ACTIVE",
    },
  });

  // booking2: student booked pkg2 (1-on-1)
  const booking2 = await db.booking.create({
    data: {
      studentId: student.id,
      oneOnOnePackageId: pkg2.id,
      courseType: "ONE_ON_ONE",
      totalSessions: 8,
      sessionsCompleted: 2,
      sessionsRemaining: 6,
      sessionsScheduled: 3,
      status: "ACTIVE",
    },
  });

  console.log("  Bookings created:", booking1.id, booking2.id);

  // ── Sessions for group course1 ─────────────────────────────────────────────
  // 3 past completed, 1 today, 5 future
  const s1 = await db.session.create({
    data: {
      groupCourseId: course1.id,
      scheduledAt: daysAgo(13),
      durationMinutes: 90,
      sessionNumber: 1,
      status: "COMPLETED",
      meetLink: "https://meet.google.com/demo-jee-001",
    },
  });

  const s2 = await db.session.create({
    data: {
      groupCourseId: course1.id,
      scheduledAt: daysAgo(10),
      durationMinutes: 90,
      sessionNumber: 2,
      status: "COMPLETED",
      meetLink: "https://meet.google.com/demo-jee-002",
    },
  });

  const s3 = await db.session.create({
    data: {
      groupCourseId: course1.id,
      scheduledAt: daysAgo(6),
      durationMinutes: 90,
      sessionNumber: 3,
      status: "COMPLETED",
      meetLink: "https://meet.google.com/demo-jee-003",
    },
  });

  // Today's session — this triggers the orange "TODAY" card in student dashboard
  await db.session.create({
    data: {
      groupCourseId: course1.id,
      scheduledAt: daysFromNow(0, 18, 30),
      durationMinutes: 90,
      sessionNumber: 4,
      status: "SCHEDULED",
      meetLink: "https://meet.google.com/abc-defg-hij",
    },
  });

  // Future group sessions
  for (let i = 0; i < 5; i++) {
    await db.session.create({
      data: {
        groupCourseId: course1.id,
        scheduledAt: daysFromNow(4 + i * 3),
        durationMinutes: 90,
        sessionNumber: 5 + i,
        status: "SCHEDULED",
        meetLink: `https://meet.google.com/demo-jee-${String(5 + i).padStart(3, "0")}`,
      },
    });
  }

  console.log("  Group sessions created");

  // ── Sessions for 1-on-1 booking2 ──────────────────────────────────────────
  const s1on1_1 = await db.session.create({
    data: {
      bookingId: booking2.id,
      scheduledAt: daysAgo(18),
      durationMinutes: 60,
      sessionNumber: 1,
      status: "COMPLETED",
      meetLink: "https://meet.google.com/demo-chem-001",
    },
  });

  const s1on1_2 = await db.session.create({
    data: {
      bookingId: booking2.id,
      scheduledAt: daysAgo(11),
      durationMinutes: 60,
      sessionNumber: 2,
      status: "COMPLETED",
      meetLink: "https://meet.google.com/demo-chem-002",
    },
  });

  // Future 1-on-1 session (already confirmed)
  await db.session.create({
    data: {
      bookingId: booking2.id,
      scheduledAt: daysFromNow(5),
      durationMinutes: 60,
      sessionNumber: 3,
      status: "SCHEDULED",
      meetLink: "https://meet.google.com/demo-chem-003",
    },
  });

  console.log("  1-on-1 sessions created");

  // ── Session feedback ───────────────────────────────────────────────────────
  // s1 and s2 have feedback; s3 does NOT → shows "Rate ★" button
  await db.sessionFeedback.create({
    data: {
      sessionId: s1.id,
      studentId: student.id,
      rating: 5,
      comment: "Excellent explanation of Newton's laws. The pulley problem breakdown was very clear!",
    },
  });

  await db.sessionFeedback.create({
    data: {
      sessionId: s2.id,
      studentId: student.id,
      rating: 4,
      comment: "Great session on SHM. Would have liked more problems.",
    },
  });

  // 1-on-1 feedback
  await db.sessionFeedback.create({
    data: {
      sessionId: s1on1_1.id,
      studentId: student.id,
      rating: 5,
      comment: "Priya didi's organic chemistry revision is incredible. Cleared so many doubts.",
    },
  });

  await db.sessionFeedback.create({
    data: {
      sessionId: s1on1_2.id,
      studentId: student.id,
      rating: 5,
    },
  });

  console.log("  Feedback created");

  // ── Pending slot proposal ─────────────────────────────────────────────────
  // Student has proposed a slot for the next 1-on-1 session
  const nextFriday = new Date();
  nextFriday.setDate(nextFriday.getDate() + ((5 - nextFriday.getDay() + 7) % 7 || 7));

  await db.slotProposal.create({
    data: {
      bookingId: booking2.id,
      proposedDate: nextFriday,
      proposedStartTime: "18:00",
      status: "PENDING",
    },
  });

  console.log("  Slot proposal created");

  // ── Topic request ─────────────────────────────────────────────────────────
  await db.topicRequest.create({
    data: {
      studentId: student.id,
      subject: "Physics",
      topicDescription: "Electromagnetic induction — specifically Faraday's law and Lenz's law derivations with JEE Advanced level problems",
      status: "OPEN",
    },
  });

  // ── Parent access ─────────────────────────────────────────────────────────
  await db.parentAccess.create({
    data: {
      studentId: student.id,
      parentName: "Sunita Mehta",
      parentPhone: "9800000001",
      parentEmail: "sunita.mehta@gmail.com",
      verified: true,
    },
  });

  // ── Teacher tokens (for public schedule link on teacher profile) ──────────
  await db.teacherToken.create({ data: { teacherId: teacher1.id } });
  await db.teacherToken.create({ data: { teacherId: teacher2.id } });

  console.log("✓ Seed complete");
  console.log("");
  console.log("Demo accounts:");
  console.log("  Student  → /api/dev/login?email=arjun.mehta@educonnect.in");
  console.log("  Teacher  → /api/dev/login?email=ravi.kumar@educonnect.in");
  console.log("  Admin    → /api/dev/login?email=demo-admin@educonnect.in");
  console.log("  Or visit → /demo");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
