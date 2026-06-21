import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";
import ProposeSlotButton from "./ProposeSlotButton";
import TopicRequestForm from "./TopicRequestForm";
import ParentAccessSection from "./ParentAccessSection";

export const dynamic = "force-dynamic";

function isToday(date: Date): boolean {
  const now = new Date();
  return date.toDateString() === now.toDateString();
}

function isTomorrow(date: Date): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return date.toDateString() === tomorrow.toDateString();
}

function dayLabel(date: Date): string {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" });
}

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const now = new Date();

  const [upcoming, past, bookings, parents] = await Promise.all([
    prisma.session.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now },
        OR: [
          { booking: { studentId: user.id } },
          { groupCourse: { bookings: { some: { studentId: user.id, status: "ACTIVE" } } } },
        ],
      },
      include: {
        booking: {
          include: { oneOnOnePackage: { include: { teacher: { select: { name: true } } } } },
        },
        groupCourse: { include: { teacher: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    prisma.session.findMany({
      where: {
        OR: [
          { booking: { studentId: user.id } },
          { groupCourse: { bookings: { some: { studentId: user.id } } } },
        ],
        AND: [
          { OR: [{ status: { not: "SCHEDULED" } }, { scheduledAt: { lt: now } }] },
        ],
      },
      include: {
        booking: {
          include: { oneOnOnePackage: { include: { teacher: { select: { name: true } } } } },
        },
        groupCourse: { include: { teacher: { select: { name: true } } } },
        feedback: { where: { studentId: user.id }, select: { id: true }, take: 1 },
      },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
    prisma.booking.findMany({
      where: { studentId: user.id, status: "ACTIVE" },
      include: {
        groupCourse: { select: { title: true, subject: true } },
        oneOnOnePackage: { select: { title: true, subject: true } },
        slotProposals: { where: { status: "PENDING" }, take: 1 },
      },
    }),
    prisma.parentAccess.findMany({
      where: { studentId: user.id },
      select: { id: true, parentName: true, parentPhone: true, parentEmail: true, verified: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  function sessionTitle(s: typeof upcoming[number]) {
    return s.groupCourse?.title ?? s.booking?.oneOnOnePackage?.title ?? "Session";
  }
  function sessionTeacher(s: typeof upcoming[number]) {
    return s.groupCourse?.teacher.name ?? s.booking?.oneOnOnePackage?.teacher.name ?? "—";
  }

  const hasAnything = bookings.length > 0 || upcoming.length > 0 || past.length > 0;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <header className="bg-white border-b border-gray-100 px-4 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-base font-bold text-gray-900">{user.name}</h1>
            <p className="text-xs text-gray-400">{user.email ?? user.phone}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/browse"
              className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
              Browse
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

        {/* ── Empty state for brand-new users ───────────────────────────── */}
        {!hasAnything && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Start your JEE journey</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto leading-relaxed">
              Explore verified teachers, join group courses or book 1-on-1 sessions.
            </p>
            <Link href="/browse"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
              Find a teacher
            </Link>
            <div className="mt-8 grid grid-cols-3 gap-3 text-center">
              {[["Verified", "All teachers reviewed"], ["Affordable", "₹299/session up"], ["Recorded", "Miss nothing"]].map(([title, sub]) => (
                <div key={title} className="bg-white rounded-xl p-3 border border-gray-100">
                  <p className="text-xs font-bold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Upcoming sessions ──────────────────────────────────────────── */}
        {hasAnything && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-gray-900">Upcoming sessions</h2>
              {upcoming.length === 0 && (
                <Link href="/browse" className="text-xs text-indigo-600 font-medium">Browse →</Link>
              )}
            </div>

            {upcoming.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-5 py-8 text-center">
                <p className="text-sm text-gray-500 mb-3">No upcoming sessions scheduled.</p>
                <Link href="/browse"
                  className="inline-block text-sm font-semibold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">
                  Browse teachers
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map((s) => {
                  const date = new Date(s.scheduledAt);
                  const today = isToday(date);
                  return (
                    <div
                      key={s.id}
                      className={`rounded-2xl border p-4 transition-all ${
                        today
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200"
                          : "bg-white border-gray-100 shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {today && (
                              <span className="text-xs font-bold bg-white/20 rounded-full px-2 py-0.5 shrink-0">TODAY</span>
                            )}
                            <p className={`font-semibold text-sm truncate ${today ? "text-white" : "text-gray-900"}`}>
                              {sessionTitle(s)}
                            </p>
                          </div>
                          <p className={`text-xs ${today ? "text-indigo-200" : "text-gray-500"}`}>
                            {sessionTeacher(s)} · {dayLabel(date)} · {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {s.meetLink && (
                          <a
                            href={s.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`shrink-0 text-xs font-bold px-3 py-2 rounded-xl transition-colors ${
                              today
                                ? "bg-white text-indigo-700 hover:bg-indigo-50"
                                : "bg-indigo-600 text-white hover:bg-indigo-700"
                            }`}
                          >
                            Join
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ── Active bookings / enrolments ───────────────────────────────── */}
        {bookings.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">My enrolments</h2>
            <div className="space-y-3">
              {bookings.map((b) => {
                const pct = Math.round((b.sessionsCompleted / b.totalSessions) * 100);
                return (
                  <div key={b.id} className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                    <div className="flex justify-between items-start gap-3 mb-3">
                      <div>
                        <p className="font-semibold text-sm text-gray-900">
                          {b.groupCourse?.title ?? b.oneOnOnePackage?.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {b.groupCourse?.subject ?? b.oneOnOnePackage?.subject}
                          {b.courseType === "ONE_ON_ONE" && " · 1-on-1"}
                        </p>
                      </div>
                      <span className="text-xs text-gray-500 shrink-0">
                        {b.sessionsCompleted}/{b.totalSessions} done
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {b.courseType === "ONE_ON_ONE" && b.sessionsRemaining > 0 && (
                      <div className="mt-1">
                        {b.slotProposals.length > 0 ? (
                          <span className="text-xs text-amber-600 font-medium">
                            Slot proposal sent — waiting for teacher
                          </span>
                        ) : (
                          <ProposeSlotButton bookingId={b.id} />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Topic requests ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-base font-bold text-gray-900 mb-1">Request a topic</h2>
          <p className="text-xs text-gray-500 mb-3">Teachers see your requests as demand signals when planning new courses.</p>
          <TopicRequestForm />
        </section>

        {/* ── Parent access ──────────────────────────────────────────────── */}
        <ParentAccessSection parents={parents} />

        {/* ── Past sessions ──────────────────────────────────────────────── */}
        {past.length > 0 && (
          <section>
            <h2 className="text-base font-bold text-gray-900 mb-3">Past sessions</h2>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {past.map((s, i) => {
                const hasRated = s.feedback.length > 0;
                const canRate = s.status === "COMPLETED" && !hasRated;
                return (
                  <div key={s.id} className={`flex justify-between items-center px-4 py-3 ${i !== past.length - 1 ? "border-b border-gray-50" : ""}`}>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{sessionTitle(s)}</p>
                      <p className="text-xs text-gray-400">
                        {sessionTeacher(s)} · {new Date(s.scheduledAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {canRate && (
                        <Link href={`/student/sessions/${s.id}`}
                          className="text-xs font-semibold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg hover:bg-amber-100 transition-colors">
                          Rate ★
                        </Link>
                      )}
                      {hasRated && (
                        <span className="text-xs text-gray-300">★ rated</span>
                      )}
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                        s.status === "CANCELLED" ? "bg-gray-100 text-gray-500" :
                        s.status === "NO_SHOW" ? "bg-red-100 text-red-600" :
                        "bg-blue-100 text-blue-700"
                      }`}>
                        {s.status === "COMPLETED" ? "Done" : s.status === "CANCELLED" ? "Cancelled" : s.status === "NO_SHOW" ? "Missed" : s.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* bottom padding for mobile */}
        <div className="h-8" />
      </div>
    </main>
  );
}
