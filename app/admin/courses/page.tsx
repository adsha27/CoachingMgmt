import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminCoursesPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const [groupCourses, packages] = await Promise.all([
    prisma.groupCourse.findMany({
      include: { teacher: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.oneOnOnePackage.findMany({
      include: { teacher: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-sm text-orange-600 hover:underline">← Admin</Link>
        <h1 className="text-2xl font-bold text-gray-900">All Courses</h1>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Group Courses <span className="text-sm font-normal text-gray-500">({groupCourses.length})</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-4">Title</th>
                <th className="pb-2 pr-4">Teacher</th>
                <th className="pb-2 pr-4">Subject</th>
                <th className="pb-2 pr-4">Price</th>
                <th className="pb-2 pr-4">Enrolled</th>
                <th className="pb-2 pr-4">Status</th>
                <th className="pb-2">Starts</th>
              </tr>
            </thead>
            <tbody>
              {groupCourses.map((c) => (
                <tr key={c.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-900">{c.title}</td>
                  <td className="py-3 pr-4 text-gray-600">{c.teacher.name}</td>
                  <td className="py-3 pr-4 text-gray-600">{c.subject}</td>
                  <td className="py-3 pr-4 text-gray-900">₹{c.priceINR.toLocaleString("en-IN")}</td>
                  <td className="py-3 pr-4 text-gray-600">{c.enrolledCount}/{c.maxStudents}</td>
                  <td className="py-3 pr-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      c.status === "LISTED" ? "bg-green-100 text-green-700" :
                      c.status === "FULL" ? "bg-amber-100 text-amber-700" :
                      c.status === "CLOSED" ? "bg-gray-100 text-gray-500" :
                      "bg-blue-100 text-blue-700"
                    }`}>{c.status}</span>
                  </td>
                  <td className="py-3 text-gray-600">
                    {c.startDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                </tr>
              ))}
              {groupCourses.length === 0 && (
                <tr><td colSpan={7} className="py-6 text-center text-gray-400">No group courses yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          1-on-1 Packages <span className="text-sm font-normal text-gray-500">({packages.length})</span>
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase tracking-wide">
                <th className="pb-2 pr-4">Title</th>
                <th className="pb-2 pr-4">Teacher</th>
                <th className="pb-2 pr-4">Subject</th>
                <th className="pb-2 pr-4">Price</th>
                <th className="pb-2 pr-4">Sessions</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((p) => (
                <tr key={p.id} className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium text-gray-900">{p.title}</td>
                  <td className="py-3 pr-4 text-gray-600">{p.teacher.name}</td>
                  <td className="py-3 pr-4 text-gray-600">{p.subject}</td>
                  <td className="py-3 pr-4 text-gray-900">₹{p.priceINR.toLocaleString("en-IN")}</td>
                  <td className="py-3 pr-4 text-gray-600">{p.totalSessions}×{p.sessionDurationMinutes}min</td>
                  <td className="py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      p.status === "LISTED" ? "bg-green-100 text-green-700" :
                      p.status === "CLOSED" ? "bg-gray-100 text-gray-500" :
                      "bg-blue-100 text-blue-700"
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
              {packages.length === 0 && (
                <tr><td colSpan={6} className="py-6 text-center text-gray-400">No 1-on-1 packages yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
