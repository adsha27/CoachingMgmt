import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [pendingVerifications, cancellationRequests, teacherCount, studentCount, openTopicRequests, recentFeedback] =
    await Promise.all([
      prisma.teacherProfile.count({ where: { verifyStatus: "PENDING" } }),
      prisma.cancellationRequest.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
      prisma.topicRequest.count({ where: { status: "OPEN" } }),
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
    { label: "Active teachers", value: teacherCount },
    { label: "Active students", value: studentCount },
    { label: "Pending verifications", value: pendingVerifications, alert: pendingVerifications > 0 },
    { label: "Pending cancellations", value: cancellationRequests, alert: cancellationRequests > 0 },
  ];

  const navLinks = [
    { href: "/admin/verification", label: "Verification queue", badge: pendingVerifications },
    { href: "/admin/teachers", label: "Teachers" },
    { href: "/admin/courses", label: "All courses" },
    { href: "/admin/cancellations", label: "Cancellations", badge: cancellationRequests },
    { href: "/admin/topic-requests", label: "Topic requests", badge: openTopicRequests },
  ];

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
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
  );
}
