import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";
import AvailabilitySection from "./AvailabilitySection";

export const dynamic = "force-dynamic";

export default async function TeacherDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  const now = new Date();

  const [upcoming, past, slots] = await Promise.all([
    prisma.session.findMany({
      where: { teacherId: user.id, status: "SCHEDULED", scheduledDate: { gte: now } },
      include: { students: { include: { student: { select: { name: true, email: true } } } } },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.session.findMany({
      where: {
        teacherId: user.id,
        OR: [{ status: { not: "SCHEDULED" } }, { scheduledDate: { lt: now } }],
      },
      orderBy: { scheduledDate: "desc" },
      take: 20,
    }),
    prisma.teacherAvailability.findMany({
      where: { teacherId: user.id, startTime: { gte: now } },
      orderBy: { startTime: "asc" },
    }),
  ]);

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
              const date = new Date(s.scheduledDate);
              const studentNames = s.students.map((ss) => ss.student.name);
              return (
                <Link
                  key={s.id}
                  href={`/teacher/sessions/${s.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{s.subject}</p>
                      <p className="text-sm text-gray-500">
                        {date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {" · "}
                        {s.durationMinutes} min
                      </p>
                      {studentNames.length > 0 && (
                        <p className="text-sm text-gray-400 mt-0.5">{studentNames.join(", ")}</p>
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

      {/* Availability */}
      <AvailabilitySection slots={slots} />

      {/* Past sessions */}
      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Past sessions</h2>
          <div className="space-y-2">
            {past.map((s) => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">{s.subject}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(s.scheduledDate).toLocaleDateString("en-IN")}
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
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
