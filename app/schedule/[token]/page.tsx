import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SchedulePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const teacherToken = await prisma.teacherToken.findUnique({
    where: { token },
    include: {
      teacher: {
        select: { name: true, email: true },
      },
    },
  });

  // 404 for missing token or soft-deleted (teacher removed)
  if (!teacherToken || teacherToken.deletedAt) {
    notFound();
  }

  const sessions = await prisma.session.findMany({
    where: {
      teacherId: teacherToken.teacherId,
      status: { not: "CANCELLED" },
      scheduledDate: { gte: new Date() },
    },
    include: {
      students: { include: { student: { select: { name: true } } } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  const teacher = teacherToken.teacher;

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{teacher.name}</h1>
        <p className="text-sm text-gray-500 mt-1">Upcoming sessions</p>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <p className="text-lg">No upcoming sessions scheduled.</p>
          <p className="text-sm mt-2">Check back after your admin adds sessions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => {
            const date = new Date(session.scheduledDate);
            const dateStr = date.toLocaleDateString("en-IN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            });
            const timeStr = date.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
            });
            const studentNames = session.students.map((ss) => ss.student.name);

            return (
              <div
                key={session.id}
                className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
              >
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h2 className="font-semibold text-gray-900 text-lg leading-snug">
                      {session.subject}
                    </h2>
                    <p className="text-gray-600 mt-1">
                      {dateStr}
                    </p>
                    <p className="text-gray-600">
                      {timeStr} &middot; {session.durationMinutes} min
                    </p>
                    {studentNames.length > 0 && (
                      <p className="text-sm text-gray-400 mt-1">
                        Students: {studentNames.join(", ")}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${
                      session.status === "SCHEDULED"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>

                {session.meetLink && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <a
                      href={session.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
                    >
                      Join Google Meet
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-12 text-xs text-gray-300 text-center">
        This page is private — keep this link to yourself.
      </p>
    </main>
  );
}
