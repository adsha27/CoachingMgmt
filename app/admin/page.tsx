import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [pendingVerifications, cancellationRequests, teacherCount, studentCount] =
    await Promise.all([
      prisma.teacherProfile.count({ where: { verifyStatus: "PENDING" } }),
      prisma.cancellationRequest.count({ where: { status: "PENDING" } }),
      prisma.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
      prisma.user.count({ where: { role: "STUDENT", status: "ACTIVE" } }),
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {navLinks.map(({ href, label, badge }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors"
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
    </main>
  );
}
