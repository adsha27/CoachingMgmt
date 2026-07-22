/**
 * Resets the STAGING database to a known state.
 *
 * Destructive: wipes all app data, then creates fixed accounts so the operator
 * can log in and exercise the full flow. Idempotent — re-run any time to get
 * back to a clean slate.
 *
 * Usage:
 *   DATABASE_URL="<staging url>" node scripts/seed-staging.mjs
 */
import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.staging.local" });
loadEnv({ path: ".env.local", override: false });

const url = process.env.DATABASE_URL ?? "";

// Guard: this script deletes everything, so it must never touch production.
// Neon hostnames are random words ("ep-plain-pond"), not environment names, so
// both endpoints are pinned explicitly rather than pattern-matched.
const PROD_HOST = "ep-purple-lab";   // production branch — always refuse
const STAGING_HOST = "ep-plain-pond"; // staging branch — the only allowed target
if (!url) {
  console.error("DATABASE_URL is not set. Refusing to run.");
  process.exit(1);
}
if (url.includes(PROD_HOST)) {
  console.error("DATABASE_URL points at the PRODUCTION branch. Refusing to run.");
  process.exit(1);
}
if (!url.includes(STAGING_HOST) && process.env.STAGING_SEED_CONFIRM !== "yes") {
  console.error(
    `DATABASE_URL is not the known staging endpoint (${STAGING_HOST}).\n` +
    "If this really is a throwaway database, re-run with STAGING_SEED_CONFIRM=yes",
  );
  process.exit(1);
}

const prisma = new PrismaClient({ datasources: { db: { url } } });
const hash = (s) => bcryptjs.hash(s, 10);

const ACCOUNTS = {
  admin:   { email: "admin@staging.novusclasses.in",   password: "StagingAdmin#1",   name: "Staging Admin",   phone: "9000000001", role: "ADMIN" },
  teacher: { email: "teacher@staging.novusclasses.in", password: "StagingTeacher#1", name: "Staging Teacher", phone: "9000000002", role: "TEACHER" },
  student: { email: "student@staging.novusclasses.in", password: "StagingStudent#1", name: "Staging Student", phone: "9000000003", role: "STUDENT" },
};

async function wipe() {
  // Child-first so foreign keys never block the delete.
  await prisma.sessionFeedback.deleteMany({});
  await prisma.slotProposal.deleteMany({});
  await prisma.cancellationRequest.deleteMany({});
  await prisma.session.deleteMany({});
  await prisma.booking.deleteMany({});
  await prisma.inviteLink.deleteMany({});
  await prisma.topicRequest.deleteMany({});
  await prisma.groupCourse.deleteMany({});
  await prisma.oneOnOnePackage.deleteMany({});
  await prisma.teacherAvailability.deleteMany({});
  await prisma.teacherProfile.deleteMany({});
  await prisma.teacherToken.deleteMany({});
  await prisma.parentAccess.deleteMany({});
  await prisma.passwordResetToken.deleteMany({});
  await prisma.userSession.deleteMany({});
  await prisma.otpCode.deleteMany({});
  await prisma.user.deleteMany({});
}

async function main() {
  console.log(`Resetting staging at ${url.replace(/:[^:@]*@/, ":****@").split("@")[1]?.split("/")[0]}`);
  await wipe();

  const users = {};
  for (const [key, a] of Object.entries(ACCOUNTS)) {
    users[key] = await prisma.user.create({
      data: {
        name: a.name, email: a.email, phone: a.phone, role: a.role,
        status: "ACTIVE", password: await hash(a.password),
        ...(a.role === "STUDENT" ? { targetExam: "NEET", currentClass: "Class 12" } : {}),
      },
    });
  }

  // Verified teacher profile so the teacher is listed on the marketplace.
  await prisma.teacherProfile.create({
    data: {
      teacherId: users.teacher.id, verifyStatus: "VERIFIED",
      subjects: ["Chemistry", "Physics"], targetExams: ["JEE Advanced", "NEET"],
      expertiseTags: ["Organic Chemistry", "Thermodynamics"],
      bio: "Staging teacher account for testing.",
      qualifications: "M.Sc. Chemistry", teachingExperienceYears: 8,
    },
  });

  // A published course with a meeting link already set.
  const course = await prisma.groupCourse.create({
    data: {
      teacherId: users.teacher.id, title: "Staging Chemistry Batch",
      subject: "Chemistry", targetExam: "JEE Advanced", description: "Test course on staging.",
      totalSessions: 4, sessionDurationMinutes: 60, priceINR: 1999, originalPriceINR: 2999,
      maxStudents: 10, startDate: new Date(Date.now() + 7 * 864e5), status: "LISTED",
    },
  });
  await prisma.session.createMany({
    data: Array.from({ length: 4 }, (_, i) => ({
      groupCourseId: course.id, sessionNumber: i + 1,
      scheduledAt: new Date(Date.now() + (i + 7) * 864e5),
      durationMinutes: 60, status: "SCHEDULED",
      meetLink: "https://meet.google.com/staging-test-room",
    })),
  });

  // A pending application, so "approve -> student gets the link" is testable immediately.
  await prisma.booking.create({
    data: {
      studentId: users.student.id, groupCourseId: course.id, status: "PENDING",
      courseType: "GROUP", totalSessions: 4, sessionsRemaining: 4,
    },
  });

  // A second teacher awaiting approval, to test the approve-and-list flow.
  await prisma.user.create({
    data: {
      name: "Staging Pending Teacher", email: "pending@staging.novusclasses.in",
      phone: "9000000004", role: "TEACHER", status: "PENDING", password: await hash("StagingTeacher#1"),
    },
  });

  console.log("\nStaging reset. Log in with:\n");
  for (const a of Object.values(ACCOUNTS)) {
    console.log(`  ${a.role.padEnd(8)} ${a.email}  /  ${a.password}`);
  }
  console.log(`  TEACHER  pending@staging.novusclasses.in  /  StagingTeacher#1   (awaiting approval)`);
  console.log(`\n  Course "${course.title}" is LISTED with a meeting link and 1 pending application.`);
}

main().finally(() => prisma.$disconnect());
