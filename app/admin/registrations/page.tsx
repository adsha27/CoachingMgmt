import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/app/_components/LogoutButton";
import RegistrationsClient from "./RegistrationsClient";

export const dynamic = "force-dynamic";

export default async function RegistrationsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const pending = await prisma.user.findMany({
    where: { status: "INACTIVE", role: { in: ["TEACHER", "STUDENT"] } },
    include: { teacherProfile: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="max-w-3xl mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pending Registrations</h1>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <LogoutButton />
      </div>

      <div className="flex gap-4 mb-6 text-sm">
        <Link href="/admin" className="text-indigo-600 hover:underline">Sessions</Link>
        <Link href="/admin/teachers" className="text-indigo-600 hover:underline">Teachers</Link>
        <Link href="/admin/students" className="text-indigo-600 hover:underline">Students</Link>
        <span className="text-gray-900 font-medium">Registrations</span>
      </div>

      <RegistrationsClient
        users={pending.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
          teacherProfile: u.teacherProfile
            ? {
                subjects: u.teacherProfile.subjects,
                bio: u.teacherProfile.bio,
                verifyStatus: u.teacherProfile.verifyStatus,
              }
            : null,
        }))}
      />
    </main>
  );
}
