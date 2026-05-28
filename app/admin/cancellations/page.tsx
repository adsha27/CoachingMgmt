import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CancellationsClient from "./CancellationsClient";

export const dynamic = "force-dynamic";

export default async function AdminCancellationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const requests = await prisma.cancellationRequest.findMany({
    where: { status: "PENDING" },
    include: {
      teacher: { select: { name: true } },
      session: { select: { id: true, scheduledAt: true, durationMinutes: true } },
      groupCourse: { select: { id: true, title: true } },
      oneOnOnePackage: { select: { id: true, title: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const data = requests.map((r) => ({
    id: r.id,
    teacherName: r.teacher.name,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    session: r.session ? {
      id: r.session.id,
      scheduledAt: r.session.scheduledAt.toISOString(),
      durationMinutes: r.session.durationMinutes,
    } : null,
    groupCourse: r.groupCourse ? { id: r.groupCourse.id, title: r.groupCourse.title } : null,
    oneOnOnePackage: r.oneOnOnePackage ? { id: r.oneOnOnePackage.id, title: r.oneOnOnePackage.title } : null,
  }));

  return (
    <main className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Admin</Link>
        <h1 className="text-2xl font-bold text-gray-900">
          Cancellation Requests{" "}
          <span className="text-base font-normal text-gray-500">({data.length} pending)</span>
        </h1>
      </div>
      <CancellationsClient items={data} />
    </main>
  );
}
