import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const BASE = process.env.NEXT_PUBLIC_APP_URL ?? "https://novusclasses.in";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [teacherProfiles, courses] = await Promise.all([
    prisma.teacherProfile.findMany({
      where: { verifyStatus: "VERIFIED" },
      select: { teacherId: true, updatedAt: true },
    }).catch(() => [] as { teacherId: number; updatedAt: Date }[]),
    prisma.groupCourse.findMany({
      where: { status: "LISTED" },
      select: { id: true, createdAt: true },
    }).catch(() => [] as { id: number; createdAt: Date }[]),
  ]);

  const now = new Date();

  return [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/browse`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${BASE}/jee`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/neet`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...teacherProfiles.map((t) => ({
      url: `${BASE}/teacher/${t.teacherId}`,
      lastModified: t.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...courses.map((c) => ({
      url: `${BASE}/courses/${c.id}/book`,
      lastModified: c.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
