import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const STATUS_COLORS = {
  OPEN: "bg-amber-100 text-amber-700",
  FULFILLED: "bg-green-100 text-green-700",
} as const;

export default async function AdminTopicRequestsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const requests = await prisma.topicRequest.findMany({
    include: {
      student: { select: { name: true, email: true } },
      fulfilledByGroupCourse: { select: { id: true, title: true } },
      fulfilledByPackage: { select: { id: true, title: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  const openCount = requests.filter((r) => r.status === "OPEN").length;

  // Aggregate demand: count by subject
  const bySubject: Record<string, number> = {};
  for (const r of requests.filter((r) => r.status === "OPEN")) {
    bySubject[r.subject] = (bySubject[r.subject] ?? 0) + 1;
  }
  const topSubjects = Object.entries(bySubject).sort((a, b) => b[1] - a[1]).slice(0, 6);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Admin</Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Topic Requests</h1>
            <p className="text-sm text-gray-500 mt-0.5">{openCount} open demand signals from students</p>
          </div>
        </div>

        {/* Demand heatmap */}
        {topSubjects.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Most requested subjects</h2>
            <div className="flex flex-wrap gap-2">
              {topSubjects.map(([subject, count]) => (
                <span key={subject}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm font-medium px-3 py-1.5 rounded-full">
                  {subject}
                  <span className="bg-indigo-200 text-indigo-800 text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {count}
                  </span>
                </span>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 ? (
          <div className="text-center py-20 text-gray-400">No topic requests yet.</div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {requests.map((r, i) => (
              <div key={r.id}
                className={`px-5 py-4 ${i !== requests.length - 1 ? "border-b border-gray-50" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                        {r.subject}
                      </span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[r.status]}`}>
                        {r.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-800 leading-relaxed">{r.topicDescription}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {r.student.name} ({r.student.email}) ·{" "}
                      {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {r.fulfilledByGroupCourse && (
                      <p className="text-xs text-green-600 mt-1">
                        Fulfilled by: {r.fulfilledByGroupCourse.title}
                      </p>
                    )}
                    {r.fulfilledByPackage && (
                      <p className="text-xs text-green-600 mt-1">
                        Fulfilled by: {r.fulfilledByPackage.title}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
