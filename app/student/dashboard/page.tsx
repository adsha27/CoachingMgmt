import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";
import ProposeSlotButton from "./ProposeSlotButton";
import TopicRequestForm from "./TopicRequestForm";
import ParentAccessSection from "./ParentAccessSection";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const now = new Date();

  const [upcoming, past, bookings, parents] = await Promise.all([
    // Sessions via 1-on-1 bookings or group courses the student is enrolled in
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

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Active bookings summary */}
      {bookings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">My enrolments</h2>
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium text-gray-800">
                      {b.groupCourse?.title ?? b.oneOnOnePackage?.title}
                    </span>
                    <span className="text-gray-400 ml-2">
                      {b.groupCourse?.subject ?? b.oneOnOnePackage?.subject}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {b.sessionsCompleted}/{b.totalSessions} done
                  </span>
                </div>
                {b.courseType === "ONE_ON_ONE" && b.sessionsRemaining > 0 && (
                  <div className="mt-2">
                    {b.slotProposals.length > 0 ? (
                      <span className="text-xs text-amber-600">Slot proposal pending teacher response…</span>
                    ) : (
                      <ProposeSlotButton bookingId={b.id} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">
            No upcoming sessions.{" "}
            <Link href="/browse" className="text-indigo-600 hover:underline">Browse teachers</Link>
            {" "}to enrol in a course.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => {
              const date = new Date(s.scheduledAt);
              return (
                <div
                  key={s.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{sessionTitle(s)}</p>
                      <p className="text-sm text-gray-500">
                        {sessionTeacher(s)}
                        {" · "}
                        {date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1">
                      {s.meetLink && (
                        <a
                          href={s.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs bg-indigo-600 text-white px-2 py-1 rounded"
                        >
                          Join Meet
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Topic Requests */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">Topic Requests</h2>
        </div>
        <p className="text-xs text-gray-500 mb-3">Request topics you want covered — teachers see these as demand signals when creating courses.</p>
        <TopicRequestForm />
      </section>

      <ParentAccessSection parents={parents} />

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Past sessions</h2>
          <div className="space-y-2">
            {past.map((s) => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">{sessionTitle(s)}</p>
                  <p className="text-xs text-gray-400">
                    {sessionTeacher(s)} · {new Date(s.scheduledAt).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  s.status === "COMPLETED" ? "bg-green-100 text-green-700" :
                  s.status === "CANCELLED" ? "bg-gray-100 text-gray-500" :
                  s.status === "NO_SHOW" ? "bg-red-100 text-red-600" :
                  "bg-blue-100 text-blue-700"
                }`}>
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
