import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const profile = await prisma.teacherProfile.findUnique({
    where: { teacherId: user.id },
  });
  return NextResponse.json(profile ?? {});
}

export async function PUT(req: NextRequest) {
  const user = await getSession(req.cookies.get(SESSION_COOKIE)?.value ?? "");
  if (!user || user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    bio?: string;
    qualifications?: string;
    subjects?: string[];
    targetExams?: string[];
    expertiseTags?: string[];
    teachingExperienceYears?: number;
    demoVideoLink?: string;
    socialMediaLinks?: Record<string, string>;
    profilePhotoUrl?: string;
  };

  const profile = await prisma.teacherProfile.upsert({
    where: { teacherId: user.id },
    create: {
      teacherId: user.id,
      bio: body.bio,
      qualifications: body.qualifications,
      subjects: body.subjects ?? [],
      targetExams: body.targetExams ?? [],
      expertiseTags: body.expertiseTags ?? [],
      teachingExperienceYears: body.teachingExperienceYears ?? null,
      demoVideoLink: body.demoVideoLink,
      socialMediaLinks: body.socialMediaLinks ?? undefined,
      profilePhotoUrl: body.profilePhotoUrl,
    },
    update: {
      ...(body.bio !== undefined && { bio: body.bio }),
      ...(body.qualifications !== undefined && { qualifications: body.qualifications }),
      ...(body.subjects !== undefined && { subjects: body.subjects }),
      ...(body.targetExams !== undefined && { targetExams: body.targetExams }),
      ...(body.expertiseTags !== undefined && { expertiseTags: body.expertiseTags }),
      ...(body.teachingExperienceYears !== undefined && { teachingExperienceYears: body.teachingExperienceYears }),
      ...(body.demoVideoLink !== undefined && { demoVideoLink: body.demoVideoLink }),
      ...(body.socialMediaLinks !== undefined && { socialMediaLinks: body.socialMediaLinks }),
      ...(body.profilePhotoUrl !== undefined && { profilePhotoUrl: body.profilePhotoUrl }),
    },
  });

  return NextResponse.json(profile);
}
