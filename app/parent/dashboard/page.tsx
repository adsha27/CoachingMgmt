import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function ParentDashboard() {
  const session = await getCurrentUser();

  // Parent sessions have parentStudentId set
  if (!session || !session.parentStudentId) redirect("/parent/login");

  const studentId = session.parentStudentId;
  const now = new Date();

  const [student, bookings, upcoming, past] = await Promise.all([
    prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, email: true, phone: true },
    }),
    prisma.booking.findMany({
      where: { studentId, status: "ACTIVE" },
      include: {
        groupCourse: { select: { title: true, subject: true, teacher: { select: { name: true } } } },
        oneOnOnePackage: { select: { title: true, subject: true, teacher: { select: { name: true } } } },
      },
    }),
    prisma.session.findMany({
      where: {
        status: "SCHEDULED",
        scheduledAt: { gte: now },
        OR: [
          { booking: { studentId } },
          { groupCourse: { bookings: { some: { studentId, status: "ACTIVE" } } } },
        ],
      },
      include: {
        groupCourse: { include: { teacher: { select: { name: true } } } },
        booking: { include: { oneOnOnePackage: { include: { teacher: { select: { name: true } } } } } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 10,
    }),
    prisma.session.findMany({
      where: {
        OR: [
          { booking: { studentId } },
          { groupCourse: { bookings: { some: { studentId } } } },
        ],
        AND: [{ OR: [{ status: { not: "SCHEDULED" } }, { scheduledAt: { lt: now } }] }],
      },
      include: {
        groupCourse: { include: { teacher: { select: { name: true } } } },
        booking: { include: { oneOnOnePackage: { include: { teacher: { select: { name: true } } } } } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
  ]);

  if (!student) redirect("/parent/login");

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
          <p className="text-xs text-orange-600 font-medium mb-0.5">Parent view</p>
          <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
          <p className="text-sm text-gray-500">{student.email ?? student.phone}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Active enrolments */}
      {bookings.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Enrolments</h2>
          <div className="space-y-2">
            {bookings.map((b) => (
              <div key={b.id} className="flex justify-between items-center bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm">
                <div>
                  <span className="font-medium text-gray-800">
                    {b.groupCourse?.title ?? b.oneOnOnePackage?.title}
                  </span>
                  <span className="text-gray-400 ml-2 text-xs">
                    by {b.groupCourse?.teacher.name ?? b.oneOnOnePackage?.teacher.name}
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  {b.sessionsCompleted}/{b.totalSessions} done
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming sessions */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming sessions.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => {
              const date = new Date(s.scheduledAt);
              return (
                <div key={s.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <p className="font-medium text-gray-900 text-sm">{sessionTitle(s)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {sessionTeacher(s)} ·{" "}
                    {date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                    {" · "}
                    {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Past sessions */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Past sessions</h2>
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

      <div className="mt-8 pt-6 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">Read-only parent view · <Link href="/parent/login" className="hover:underline">Switch account</Link></p>
      </div>
    </main>
  );
}
