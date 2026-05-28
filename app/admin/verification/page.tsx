import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VerificationClient from "./VerificationClient";

export const dynamic = "force-dynamic";

export default async function VerificationQueuePage() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect("/login");

  const pending = await prisma.teacherProfile.findMany({
    where: { verifyStatus: { in: ["PENDING", "MORE_INFO_REQUESTED"] } },
    include: {
      teacher: {
        select: { id: true, name: true, email: true, phone: true, createdAt: true },
      },
    },
    orderBy: { updatedAt: "asc" },
  });

  const data = pending.map((p) => ({
    teacherId: p.teacherId,
    teacherName: p.teacher.name,
    teacherEmail: p.teacher.email ?? "",
    teacherPhone: p.teacher.phone,
    joinedAt: p.teacher.createdAt.toISOString(),
    subjects: p.subjects,
    targetExams: p.targetExams,
    bio: p.bio ?? "",
    qualifications: p.qualifications ?? "",
    teachingExperienceYears: p.teachingExperienceYears,
    demoVideoLink: p.demoVideoLink ?? "",
    verifyStatus: p.verifyStatus,
    rejectionReason: p.rejectionReason ?? "",
  }));

  return <VerificationClient items={data} />;
}
