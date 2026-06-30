import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import BookGroupButton from "./BookGroupButton";

export const dynamic = "force-dynamic";

export default async function BookGroupCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/courses/${(await params).id}/book`);
  if (user.role !== "STUDENT") redirect("/");

  const { id } = await params;
  const courseId = Number(id);

  const course = await prisma.groupCourse.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { id: true, name: true } },
      sessions: {
        where: { status: "SCHEDULED" },
        orderBy: { scheduledAt: "asc" },
        take: 3,
      },
    },
  });

  if (!course || course.status !== "LISTED") notFound();

  const existingBooking = await prisma.booking.findFirst({
    where: { studentId: user.id, groupCourseId: courseId, status: "ACTIVE" },
  });

  const isFull = course.enrolledCount >= course.maxStudents;

  const firstSession = course.sessions[0];
  const lastSession = course.sessions[course.sessions.length - 1];

  return (
    <main className="max-w-lg mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Link href={`/teacher/${course.teacher.id}`} className="text-sm text-orange-600 hover:underline">
          ← Teacher profile
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-1">{course.title}</h1>
        <p className="text-sm text-gray-500 mb-4">
          {course.subject}{course.targetExam ? ` · ${course.targetExam}` : ""} · by {course.teacher.name}
        </p>

        {course.description && (
          <p className="text-sm text-gray-700 mb-4">{course.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3 text-sm mb-6">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Total sessions</p>
            <p className="font-semibold text-gray-800">{course.totalSessions}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Duration each</p>
            <p className="font-semibold text-gray-800">{course.sessionDurationMinutes} min</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Price</p>
            <p className="font-semibold text-gray-800">₹{course.priceINR.toLocaleString("en-IN")}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-400 mb-0.5">Seats left</p>
            <p className={`font-semibold ${isFull ? "text-red-600" : "text-gray-800"}`}>
              {isFull ? "Full" : `${course.maxStudents - course.enrolledCount} / ${course.maxStudents}`}
            </p>
          </div>
        </div>

        {firstSession && (
          <p className="text-xs text-gray-500 mb-6">
            Sessions from{" "}
            <span className="font-medium">
              {new Date(firstSession.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
            {lastSession && lastSession.id !== firstSession.id && (
              <> to{" "}
                <span className="font-medium">
                  {new Date(lastSession.scheduledAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </>
            )}
          </p>
        )}

        {existingBooking ? (
          <div className="text-center py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
            ✓ Already enrolled · <Link href="/student/dashboard" className="underline">Go to dashboard</Link>
          </div>
        ) : isFull ? (
          <div className="text-center py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            This course is full. Check back later.
          </div>
        ) : (
          <BookGroupButton courseId={courseId} />
        )}
      </div>
    </main>
  );
}
