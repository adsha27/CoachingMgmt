import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sessions = await prisma.session.findMany({
    include: {
      teacher: { select: { name: true } },
      students: { include: { student: { select: { name: true } } } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Sessions</h1>
        <Link
          href="/admin/sessions/new"
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
        >
          Schedule session
        </Link>
      </div>

      <div className="flex gap-4 mb-6 text-sm">
        <Link href="/admin/teachers" className="text-indigo-600 hover:underline">
          Teachers
        </Link>
        <Link href="/admin/students" className="text-indigo-600 hover:underline">
          Students
        </Link>
      </div>

      {sessions.length === 0 ? (
        <p className="text-gray-500 text-sm">
          No sessions yet.{" "}
          <Link href="/admin/sessions/new" className="text-indigo-600 hover:underline">
            Schedule one
          </Link>{" "}
          to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900">{session.subject}</span>
                    <StatusBadge status={session.status} />
                    {session.emailError && (
                      <span
                        className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full"
                        title={session.emailError}
                      >
                        Email failed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    {session.teacher.name} &middot;{" "}
                    {new Date(session.scheduledDate).toLocaleString("en-IN")} &middot;{" "}
                    {session.durationMinutes} min
                  </p>
                  {session.students.length > 0 && (
                    <p className="text-sm text-gray-400 mt-0.5">
                      {session.students.map((ss) => ss.student.name).join(", ")}
                    </p>
                  )}
                  <div className="mt-2 flex gap-3">
                    {session.meetLink && (
                      <a
                        href={session.meetLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        Join Meet
                      </a>
                    )}
                    {session.cancelReason && (
                      <p className="text-sm text-red-500">
                        Cancelled: {session.cancelReason}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colours: Record<string, string> = {
    SCHEDULED: "bg-blue-100 text-blue-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-gray-100 text-gray-500",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full ${colours[status] ?? ""}`}>
      {status}
    </span>
  );
}
