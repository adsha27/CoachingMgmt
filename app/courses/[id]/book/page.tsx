import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { discountPct } from "@/lib/pricing";
import ApplyButton from "@/app/_components/ApplyButton";

export const dynamic = "force-dynamic";

export default async function ApplyGroupCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const courseId = Number(id);
  const user = await getCurrentUser();

  const course = await prisma.groupCourse.findUnique({
    where: { id: courseId },
    include: {
      teacher: { select: { id: true, name: true } },
      sessions: { where: { status: "SCHEDULED" }, orderBy: { scheduledAt: "asc" }, take: 3 },
    },
  });

  if (!course || course.status === "DRAFT") notFound();

  const existingBooking = user && user.role === "STUDENT"
    ? await prisma.booking.findFirst({
        where: { studentId: user.id, groupCourseId: courseId, status: { in: ["PENDING", "ACTIVE"] } },
      })
    : null;

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
            {(() => {
              const off = discountPct(course.originalPriceINR, course.priceINR);
              return (
                <p className="font-semibold text-gray-800">
                  ₹{course.priceINR.toLocaleString("en-IN")}
                  {off !== null && (
                    <>
                      {" "}
                      <span className="text-xs font-normal text-gray-400 line-through">₹{course.originalPriceINR!.toLocaleString("en-IN")}</span>{" "}
                      <span className="text-xs font-semibold text-emerald-600">{off}% off</span>
                    </>
                  )}
                </p>
              );
            })()}
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

        {existingBooking?.status === "ACTIVE" ? (
          <div className="text-center py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 font-medium">
            ✓ Enrolled · <Link href="/student/dashboard" className="underline">Go to dashboard</Link>
          </div>
        ) : existingBooking?.status === "PENDING" ? (
          <div className="text-center py-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 font-medium">
            ⏳ Application submitted — awaiting your teacher&apos;s approval.
          </div>
        ) : isFull ? (
          <div className="text-center py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            This course is full. Check back later.
          </div>
        ) : user && user.role === "STUDENT" ? (
          <ApplyButton courseId={courseId} />
        ) : user ? (
          <div className="text-center py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-500">
            Applying is for student accounts.
          </div>
        ) : (
          <div className="space-y-2">
            <Link href={`/login?applyCourseId=${courseId}`}
              className="block text-center w-full py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors">
              Create profile &amp; apply
            </Link>
            <Link href={`/login?next=/courses/${courseId}/book`}
              className="block text-center w-full py-2.5 text-sm text-gray-500 hover:text-gray-700">
              Already have an account? Sign in
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
