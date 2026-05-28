import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TeachersClient from "./TeachersClient";

export const dynamic = "force-dynamic";

export default async function TeachersPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const teachers = await prisma.user.findMany({
    where: { role: "TEACHER" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      createdAt: true,
      teacherProfile: { select: { verifyStatus: true, subjects: true, rating: true } },
      teacherToken: { select: { token: true, deletedAt: true } },
    },
    orderBy: { name: "asc" },
  });

  const data = teachers.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    teacherToken: t.teacherToken
      ? { ...t.teacherToken, deletedAt: t.teacherToken.deletedAt?.toISOString() ?? null }
      : null,
  }));

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin" className="text-sm text-indigo-600 hover:underline">← Admin</Link>
        <h1 className="text-2xl font-bold text-gray-900">Teachers</h1>
      </div>
      <TeachersClient teachers={data} />
    </main>
  );
}
