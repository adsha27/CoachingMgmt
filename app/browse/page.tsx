import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import BrowseClient from "./BrowseClient";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in";

export const metadata: Metadata = {
  title: "Browse JEE & NEET Teachers | Novus Classes",
  description: "Find verified JEE and NEET coaching teachers. Filter by subject, exam, and type. Group courses and 1-on-1 packages available.",
  openGraph: {
    title: "Browse Verified JEE & NEET Teachers | Novus Classes",
    description: "Filter by Physics, Chemistry, Maths, Biology. Verified teachers, real reviews.",
    url: `${BASE}/browse`,
    type: "website",
  },
  twitter: { card: "summary", title: "Browse JEE & NEET Teachers | Novus Classes" },
  alternates: { canonical: `${BASE}/browse` },
};

export default async function BrowsePage() {
  const teachers = await prisma.user.findMany({
    where: {
      role: "TEACHER",
      status: "ACTIVE",
      teacherProfile: { verifyStatus: "VERIFIED" },
      OR: [
        { groupCourses: { some: { status: "LISTED" } } },
        { oneOnOnePackages: { some: { status: "LISTED" } } },
      ],
    },
    select: {
      id: true,
      name: true,
      teacherProfile: {
        select: {
          bio: true,
          qualifications: true,
          subjects: true,
          targetExams: true,
          teachingExperienceYears: true,
          rating: true,
          profilePhotoUrl: true,
        },
      },
      groupCourses: {
        where: { status: "LISTED" },
        select: {
          id: true,
          title: true,
          subject: true,
          targetExam: true,
          priceINR: true,
          startDate: true,
          sessionDurationMinutes: true,
          totalSessions: true,
          enrolledCount: true,
          maxStudents: true,
        },
      },
      oneOnOnePackages: {
        where: { status: "LISTED" },
        select: {
          id: true,
          title: true,
          subject: true,
          targetExam: true,
          priceINR: true,
          sessionDurationMinutes: true,
          totalSessions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  }).catch((): never[] => []);

  // Serialize dates for client component
  const data = teachers.map((t) => ({
    ...t,
    groupCourses: t.groupCourses.map((c) => ({
      ...c,
      startDate: c.startDate.toISOString(),
    })),
  }));

  return <BrowseClient teachers={data} />;
}
