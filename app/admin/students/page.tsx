import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StudentsClient from "./StudentsClient";

export const dynamic = "force-dynamic";

export default async function AdminStudentsPage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      status: true,
      targetExam: true,
      currentClass: true,
      createdAt: true,
      bookings: { select: { status: true } },
    },
    orderBy: { name: "asc" },
  });

  const data = students.map((s) => {
    const enrolled = s.bookings.filter((b) => b.status === "ACTIVE").length;
    const pending = s.bookings.filter((b) => b.status === "PENDING").length;
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      status: s.status,
      targetExam: s.targetExam,
      currentClass: s.currentClass,
      createdAt: s.createdAt.toISOString(),
      enrolled,
      pending,
    };
  });

  return (
    <main className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-2">
        <Link href="/admin" className="text-sm text-orange-600 hover:underline">← Admin</Link>
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <span className="text-sm text-gray-400">{data.length}</span>
      </div>
      <p className="text-sm text-gray-500 mb-6">Contact details and enrolment status for every registered student.</p>
      <StudentsClient students={data} />
    </main>
  );
}
