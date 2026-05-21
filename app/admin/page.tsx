import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SessionsClient from "./sessions/SessionsClient";
import LogoutButton from "@/app/_components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const sessions = await prisma.session.findMany({
    include: {
      teacher: { select: { name: true } },
      students: { include: { student: { select: { name: true } } } },
    },
    orderBy: { scheduledDate: "asc" },
  });

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/sessions/new"
            className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
          >
            Schedule session
          </Link>
          <LogoutButton />
        </div>
      </div>

      <div className="flex gap-4 mb-6 text-sm">
        <Link href="/admin/teachers" className="text-indigo-600 hover:underline">
          Teachers
        </Link>
        <Link href="/admin/students" className="text-indigo-600 hover:underline">
          Students
        </Link>
      </div>

      <SessionsClient sessions={sessions.map((s) => ({
        ...s,
        scheduledDate: s.scheduledDate.toISOString(),
      }))} />
    </main>
  );
}
