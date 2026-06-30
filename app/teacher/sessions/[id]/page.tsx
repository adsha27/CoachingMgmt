import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CancelRequestButton from "./CancelRequestButton";

export const dynamic = "force-dynamic";

export default async function TeacherSessionDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user || user.role !== "TEACHER") redirect("/login");

  const { id } = await params;
  const session = await prisma.session.findUnique({
    where: { id: Number(id) },
    include: {
      groupCourse: {
        include: {
          bookings: {
            where: { status: "ACTIVE" },
            include: { student: { select: { name: true, email: true } } },
          },
        },
      },
      booking: {
        include: {
          student: { select: { name: true, email: true } },
          oneOnOnePackage: { select: { title: true, subject: true, teacherId: true } },
        },
      },
    },
  });

  // Confirm this teacher owns the session
  const teacherId = session?.groupCourse?.teacherId ?? session?.booking?.oneOnOnePackage?.teacherId;
  if (!session || teacherId !== user.id) notFound();

  const date = new Date(session.scheduledAt);
  const title = session.groupCourse?.title ?? session.booking?.oneOnOnePackage?.title ?? "Session";
  const students = session.groupCourse
    ? session.groupCourse.bookings.map((b) => b.student)
    : session.booking ? [session.booking.student] : [];

  return (
    <main className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/teacher/dashboard" className="text-sm text-orange-600 hover:underline mb-6 block">
        &larr; Dashboard
      </Link>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
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
          <div className="flex gap-4">
            <dt className="text-gray-500 w-24 shrink-0">Session #</dt>
            <dd className="text-gray-900">{session.sessionNumber}</dd>
          </div>
        </dl>

        {session.meetLink && (
          <div className="mt-5 pt-5 border-t border-gray-100">
            <a
              href={session.meetLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700"
            >
              Join Google Meet
            </a>
          </div>
        )}

        {students.length > 0 && (
          <div className="mt-6 pt-5 border-t border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              Students ({students.length})
            </h2>
            <div className="space-y-2">
              {students.map((s) => (
                <div key={s.email ?? s.name} className="flex justify-between items-center">
                  <span className="text-sm text-gray-900">{s.name}</span>
                  {s.email && <span className="text-sm text-gray-400">{s.email}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {session.cancelReason && (
          <p className="mt-4 text-sm text-red-600">
            Cancelled: {session.cancelReason}
          </p>
        )}

        {session.status === "SCHEDULED" && (
          <CancelRequestButton sessionId={session.id} />
        )}
      </div>
    </main>
  );
}
