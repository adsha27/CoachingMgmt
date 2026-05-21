import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const now = new Date();

  const [upcoming, past] = await Promise.all([
    prisma.session.findMany({
      where: {
        status: "SCHEDULED",
        scheduledDate: { gte: now },
        students: { some: { studentId: user.id } },
      },
      include: {
        teacher: { select: { name: true } },
      },
      orderBy: { scheduledDate: "asc" },
    }),
    prisma.session.findMany({
      where: {
        students: { some: { studentId: user.id } },
        OR: [{ status: { not: "SCHEDULED" } }, { scheduledDate: { lt: now } }],
      },
      include: { teacher: { select: { name: true } } },
      orderBy: { scheduledDate: "desc" },
      take: 20,
    }),
  ]);

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Upcoming */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Upcoming sessions</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-500">
            No upcoming sessions. Your admin will add you to sessions.
          </p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((s) => {
              const date = new Date(s.scheduledDate);
              return (
                <Link
                  key={s.id}
                  href={`/student/sessions/${s.id}`}
                  className="block bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="font-medium text-gray-900">{s.subject}</p>
                      <p className="text-sm text-gray-500">
                        {s.teacher.name}
                        {" · "}
                        {date.toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}
                        {" · "}
                        {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                      </p>
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

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Past sessions</h2>
          <div className="space-y-2">
            {past.map((s) => (
              <div key={s.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-700">{s.subject}</p>
                  <p className="text-xs text-gray-400">
                    {s.teacher.name} · {new Date(s.scheduledDate).toLocaleDateString("en-IN")}
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
