import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";
import AvailabilitySection from "./AvailabilitySection";
import PublishCourseButton from "./PublishCourseButton";
import ProposalsSection from "./ProposalsSection";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  const now = new Date();
  const myId = user.id;

  const [upcoming, past, slots, groupCourses, oneOnOnePackages, pendingProposals] = await Promise.all([
    prisma.session.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now },
        OR: [
          { groupCourse: { teacherId: myId } },
          { booking: { oneOnOnePackage: { teacherId: myId } } },
        ],
      },
      include: {
        groupCourse: { select: { title: true, subject: true, enrolledCount: true } },
        booking: {
          include: {
            student: { select: { name: true, email: true } },
            oneOnOnePackage: { select: { title: true, subject: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.session.findMany({
      where: {
        OR: [
          { groupCourse: { teacherId: myId } },
          { booking: { oneOnOnePackage: { teacherId: myId } } },
        ],
        AND: [{ OR: [{ status: { not: "SCHEDULED" } }, { scheduledAt: { lt: now } }] }],
      },
      include: {
        groupCourse: { select: { title: true, subject: true } },
        booking: { include: { oneOnOnePackage: { select: { title: true } } } },
        feedback: { select: { rating: true, comment: true }, take: 10 },
      },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
    prisma.teacherAvailability.findMany({
      where: { teacherId: myId, status: "AVAILABLE" },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    }),
    prisma.groupCourse.findMany({
      where: { teacherId: myId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.oneOnOnePackage.findMany({
      where: { teacherId: myId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.slotProposal.findMany({
      where: {
        status: "PENDING",
        booking: { oneOnOnePackage: { teacherId: myId } },
      },
      include: {
        booking: {
          include: {
            student: { select: { name: true } },
            oneOnOnePackage: { select: { title: true, sessionDurationMinutes: true } },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const proposalData = pendingProposals.map((p) => ({
    id: p.id,
    bookingId: p.bookingId,
    proposedDate: p.proposedDate.toISOString(),
    proposedStartTime: p.proposedStartTime,
    studentName: p.booking.student.name ?? "Student",
    packageTitle: p.booking.oneOnOnePackage?.title ?? "Package",
    durationMinutes: p.booking.oneOnOnePackage?.sessionDurationMinutes ?? 60,
  }));

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Upcoming sessions */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">
            No upcoming sessions. Check back after your admin schedules one.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => {
              const date = new Date(s.scheduledAt);
              const title = s.groupCourse?.title ?? s.booking?.oneOnOnePackage?.title ?? "Session";
              const subtitle = s.groupCourse
                ? `${s.groupCourse.enrolledCount} students enrolled`
                : s.booking?.student.name ?? "";
              return (
                <Link
                  key={s.id}
                  href={`/teacher/sessions/${s.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{title}</p>
                      <p className="text-sm text-gray-500">
                        {date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        {s.durationMinutes} min
                      </p>
                      {subtitle && (
                        <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
                      )}
                    </div>
                    {s.meetLink && (
                      <span className="shrink-0 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full">
                        Meet ready
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Pending slot proposals */}
      <ProposalsSection proposals={proposalData} />

      {/* My Courses */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">My Courses</h2>
          <div className="flex gap-3">
            <Link href="/teacher/courses/new" className="text-sm text-indigo-600 hover:underline">+ Group course</Link>
            <Link href="/teacher/packages/new" className="text-sm text-emerald-600 hover:underline">+ 1-on-1 package</Link>
          </div>
        </div>
        {groupCourses.length === 0 && oneOnOnePackages.length === 0 ? (
          <p className="text-sm text-gray-500">No courses yet. Create a group course or 1-on-1 package to start.</p>
        ) : (
          <div className="space-y-3">
            {groupCourses.map((c) => (
              <div key={`g-${c.id}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{c.title}</p>
                    <p className="text-sm text-gray-500">{c.subject}{c.targetExam ? ` · ${c.targetExam}` : ""}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {c.enrolledCount}/{c.maxStudents} enrolled · {c.totalSessions} sessions · ₹{c.priceINR.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      c.status === "LISTED" ? "bg-green-100 text-green-700" :
                      c.status === "DRAFT" ? "bg-gray-100 text-gray-500" :
                      c.status === "FULL" ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-600"
                    }`}>{c.status}</span>
                    {c.status === "DRAFT" && (
                      <PublishCourseButton id={c.id} type="group" />
                    )}
                  </div>
                </div>
              </div>
            ))}
            {oneOnOnePackages.map((p) => (
              <div key={`p-${p.id}`} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-500">{p.subject}{p.targetExam ? ` · ${p.targetExam}` : ""} · 1-on-1</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {p.totalSessions} sessions · ₹{p.priceINR.toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      p.status === "LISTED" ? "bg-emerald-100 text-emerald-700" :
                      p.status === "DRAFT" ? "bg-gray-100 text-gray-500" :
                      "bg-red-100 text-red-600"
                    }`}>{p.status}</span>
                    {p.status === "DRAFT" && (
                      <PublishCourseButton id={p.id} type="package" />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Availability */}
      <AvailabilitySection slots={slots} />

      {/* Past sessions */}
      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Past sessions</h2>
          <div className="space-y-2">
            {past.map((s) => (
              <div key={s.id} className="py-2 border-b border-gray-100">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {s.groupCourse?.title ?? s.booking?.oneOnOnePackage?.title ?? "Session"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(s.scheduledAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    s.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                    s.status === "CANCELLED" ? "bg-gray-100 text-gray-500" :
                    "bg-blue-100 text-blue-700"
                  }`}>
                    {s.status}
                  </span>
                </div>
                {s.feedback.length > 0 && (
                  <div className="mt-1 space-y-0.5">
                    {s.feedback.map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className="text-yellow-400">{"★".repeat(f.rating)}<span className="text-gray-300">{"★".repeat(5 - f.rating)}</span></span>
                        {f.comment && <span className="italic text-gray-400">&ldquo;{f.comment}&rdquo;</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
