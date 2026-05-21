import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StudentSessionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") redirect("/login");

  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id: Number(id) },
    include: {
      teacher: { select: { name: true } },
      students: { where: { studentId: user.id } },
    },
  });

  if (!session || session.students.length === 0) notFound();

  const date = new Date(session.scheduledDate);

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/student/dashboard" className="text-sm text-indigo-600 hover:underline mb-6 block">
        &larr; Dashboard
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-xl font-bold text-gray-900">{session.subject}</h1>
          <span className={`text-xs px-2 py-1 rounded-full ${
            session.status === "SCHEDULED" ? "bg-blue-100 text-blue-800" :
            session.status === "COMPLETED" ? "bg-green-100 text-green-800" :
            "bg-gray-100 text-gray-500"
          }`}>
            {session.status}
          </span>
        </div>

        <dl className="space-y-3 text-sm">
          <div className="flex gap-4">
            <dt className="text-gray-500 w-24 shrink-0">Teacher</dt>
            <dd className="text-gray-900">{session.teacher.name}</dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-gray-500 w-24 shrink-0">Date</dt>
            <dd className="text-gray-900">
              {date.toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-gray-500 w-24 shrink-0">Time</dt>
            <dd className="text-gray-900">
              {date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
            </dd>
          </div>
          <div className="flex gap-4">
            <dt className="text-gray-500 w-24 shrink-0">Duration</dt>
            <dd className="text-gray-900">{session.durationMinutes} minutes</dd>
          </div>
        </dl>

        {session.meetLink && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <a
              href={session.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700"
            >
              Join Google Meet
            </a>
          </div>
        )}

        {session.cancelReason && (
          <p className="mt-4 text-sm text-red-600">Cancelled: {session.cancelReason}</p>
        )}
      </div>
    </main>
  );
}
