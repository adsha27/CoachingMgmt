import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";
import AppNav from "@/app/_components/AppNav";
import PendingTeachersSection from "./PendingTeachersSection";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [pendingTeachers, pendingVerifications, cancellationRequests, teacherCount, studentCount, openTopicRequests, pendingApplications, recentFeedback] =
    await Promise.all([
      prisma.user.findMany({
        where: { role: "TEACHER", status: "PENDING" },
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.teacherProfile.count({ where: { verifyStatus: "PENDING" } }),
      prisma.cancellationRequest.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
      prisma.topicRequest.count({ where: { status: "OPEN" } }),
      // Pending applications — admin oversight of who applied to whom.
      prisma.booking.findMany({
        where: { status: "PENDING" },
        include: {
          student: { select: { name: true, email: true, phone: true, targetExam: true, currentClass: true } },
          groupCourse: { select: { title: true, teacher: { select: { name: true } } } },
          oneOnOnePackage: { select: { title: true, teacher: { select: { name: true } } } },
        },
        orderBy: { bookedAt: "asc" },
      }),
      prisma.sessionFeedback.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        include: {
          student: { select: { name: true } },
          session: {
            include: {
              groupCourse: { include: { teacher: { select: { name: true } } } },
              booking: { include: { oneOnOnePackage: { include: { teacher: { select: { name: true } } } } } },
            },
          },
        },
      }),
    ]);

  const stats = [
    { label: "Pending approvals", value: pendingTeachers.length, alert: pendingTeachers.length > 0 },
    { label: "Active teachers", value: teacherCount },
    { label: "Active students", value: studentCount },
    { label: "Applications", value: pendingApplications.length, alert: pendingApplications.length > 0 },
    { label: "Pending verifications", value: pendingVerifications, alert: pendingVerifications > 0 },
    { label: "Pending cancellations", value: cancellationRequests, alert: cancellationRequests > 0 },
  ];

  // Teachers / Students / Courses live in the top nav — listing them here too
  // just duplicated them. These tiles are the actions the nav does not cover.
  const navLinks = [
    { href: "/admin/users/new", label: "Add teacher/student" },
    { href: "/admin/verification", label: "Verification queue", badge: pendingVerifications },
    { href: "/admin/cancellations", label: "Cancellations", badge: cancellationRequests },
    { href: "/admin/topic-requests", label: "Topic requests", badge: openTopicRequests },
  ];

  return (
    <>
    <AppNav role="ADMIN" current="/admin" />
    <main className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`rounded-xl border p-4 ${s.alert ? "border-amber-300 bg-amber-50" : "border-gray-200 bg-white"}`}
          >
            <div className={`text-2xl font-bold ${s.alert ? "text-amber-700" : "text-gray-900"}`}>
              {s.value}
            </div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Nav links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        {navLinks.map(({ href, label, badge }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-700 transition-colors"
          >
            <span>{label}</span>
            {badge != null && badge > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 leading-none">
                {badge}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Pending teacher approvals */}
      <PendingTeachersSection teachers={pendingTeachers.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))} />

      {/* Class applications awaiting teacher approval — admin oversight */}
      {pendingApplications.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-gray-800 mb-1">
            Class applications
            <span className="ml-2 text-xs font-semibold text-white bg-amber-600 px-2 py-0.5 rounded-full align-middle">{pendingApplications.length}</span>
          </h2>
          <p className="text-xs text-gray-500 mb-4">Students awaiting approval. The teacher approves; this is for your visibility.</p>
          <div className="space-y-3">
            {pendingApplications.map((b) => {
              const cls = b.groupCourse ?? b.oneOnOnePackage;
              const kind = b.groupCourse ? "Group course" : "1-on-1 package";
              return (
                <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold">{b.student.name}</span>
                        <span className="text-gray-400"> applied to </span>
                        <span className="font-medium">{cls?.title ?? "a class"}</span>
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                        <span>👨‍🏫 {cls?.teacher.name ?? "—"} · {kind}</span>
                        <span>📧 <a href={`mailto:${b.student.email}`} className="hover:underline">{b.student.email}</a></span>
                        <span>📱 <a href={`tel:${b.student.phone}`} className="hover:underline">{b.student.phone}</a></span>
                        {(b.student.targetExam || b.student.currentClass) && (
                          <span>{[b.student.targetExam, b.student.currentClass].filter(Boolean).join(" · ")}</span>
                        )}
                        <span>Applied {new Date(b.bookedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                    <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">Awaiting approval</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recent feedback */}
      {recentFeedback.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent feedback</h2>
          <div className="space-y-3">
            {recentFeedback.map((f) => {
              const teacherName = f.session.groupCourse?.teacher.name ?? f.session.booking?.oneOnOnePackage?.teacher.name ?? "—";
              const courseTitle = f.session.groupCourse?.title ?? f.session.booking?.oneOnOnePackage?.title ?? "Session";
              return (
                <div key={f.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{f.student.name}</p>
                      <p className="text-xs text-gray-500">{courseTitle} · by {teacherName}</p>
                      {f.comment && <p className="text-sm text-gray-700 mt-1 italic">&ldquo;{f.comment}&rdquo;</p>}
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-yellow-400 text-sm">
                        {"★".repeat(f.rating)}<span className="text-gray-300">{"★".repeat(5 - f.rating)}</span>
                      </div>
                      <p className="text-xs text-gray-400">{new Date(f.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </main>
    </>
  );
}
